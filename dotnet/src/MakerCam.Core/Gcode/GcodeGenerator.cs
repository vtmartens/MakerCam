using System.Globalization;

namespace MakerCam.Core;

/// <summary>
/// G-code post-processor.
///
/// The output format follows PartKam's original post-processor: a G20/G21
/// preamble, one tool change per distinct cutter, profiles cut in depth slices,
/// pockets cut level by level, and peck drilling.
/// </summary>
public static class GcodeGenerator
{
    private const string LineEnd = "\r\n";

    private static int DecimalsFor(Unit unit, double tolerance)
    {
        var tolInUnit = unit == Unit.Mm ? tolerance : tolerance / 25.4;
        // One digit finer than the requested tolerance, clamped to sane bounds.
        var digits = Math.Ceiling(-Math.Log10(Math.Max(tolInUnit, 1e-6))) + 1;
        return (int)Math.Max(2, Math.Min(6, digits));
    }

    private static string FormatNumber(double n, int decimals)
    {
        if (!double.IsFinite(n)) return "0";
        var s = JsMath.ToFixed(n, decimals);
        if (s.Contains('.')) s = s.TrimEnd('0').TrimEnd('.');
        if (s == "-0") s = "0";
        return s;
    }

    private static double ConvertLength(double mm, Unit unit) =>
        unit == Unit.In ? mm / 25.4 : mm;

    private static string FmtLength(double mm, Unit unit, int decimals) =>
        FormatNumber(ConvertLength(mm, unit), decimals);

    private static string CommentSafe(string name) =>
        System.Text.RegularExpressions.Regex.Replace(name.Replace('\r', ' ').Replace('\n', ' '), "[()]", " ")
            .Trim();

    private static List<double> ToolList(IReadOnlyList<Operation> ops)
    {
        var tools = new List<double>();
        foreach (var op in ops)
        {
            if (!tools.Any(t => Math.Abs(t - op.Params.ToolDiameter) < 1e-9))
            {
                tools.Add(op.Params.ToolDiameter);
            }
        }
        // Descending diameter; ties cannot occur because duplicates are removed.
        tools.Sort((a, b) => b.CompareTo(a));
        return tools;
    }

    private sealed class EmitState
    {
        public List<string> Lines { get; } = new();
        public Unit Unit { get; set; }
        public int Decimals { get; set; }
        public int FeedDecimals { get; set; }
        public int CurrentTool { get; set; } = -1;
        public bool CutterOn { get; set; }
    }

    private static void Emit(EmitState s, string line) => s.Lines.Add(line + LineEnd);

    private static void EnsureTool(EmitState s, Operation op, IReadOnlyList<double> tools)
    {
        var tool = -1;
        for (var i = 0; i < tools.Count; i++)
        {
            if (Math.Abs(tools[i] - op.Params.ToolDiameter) < 1e-9)
            {
                tool = i;
                break;
            }
        }
        if (tool != s.CurrentTool)
        {
            Emit(s, $"T{tool} M6");
            s.CurrentTool = tool;
        }
        if (!s.CutterOn)
        {
            Emit(s, "G17");
            Emit(s, "M3");
            s.CutterOn = true;
        }
    }

    private static void MoveTo(EmitState s, Vec p, double docx, double docy, double? withFeed = null)
    {
        var x = FmtLength(p.X + docx, s.Unit, s.Decimals);
        var y = FmtLength(p.Y - docy, s.Unit, s.Decimals);
        var line = $"G1 X{x} Y{y}";
        if (withFeed is { } feed)
        {
            line += $" F{FormatNumber(ConvertLength(feed, s.Unit), s.FeedDecimals)}";
        }
        Emit(s, line);
    }

    private static void RapidTo(EmitState s, Vec p, double docx, double docy)
    {
        var x = FmtLength(p.X + docx, s.Unit, s.Decimals);
        var y = FmtLength(p.Y - docy, s.Unit, s.Decimals);
        Emit(s, $"G0 X{x} Y{y}");
    }

    private static void PlungTo(EmitState s, double zMm, double plunge)
    {
        var z = FmtLength(zMm, s.Unit, s.Decimals);
        Emit(s, $"G1 Z{z} F{FormatNumber(ConvertLength(plunge, s.Unit), s.FeedDecimals)}");
    }

    /// <summary>
    /// Emits the moves for one loop at a given Z, inserting tab lifts.
    /// </summary>
    private static void EmitLoop(
        EmitState s,
        Loop loop,
        double depth,
        double targetDepth,
        double feedrate,
        double plungerate,
        double docx,
        double docy)
    {
        var pts = loop.Points;
        if (pts.Count == 0) return;

        var tabTop = targetDepth;
        var activeTabs = loop.Tabs
            .Where(t => t.Height > 0)
            .Select(t => (Start: t.Start, End: t.Start + t.Width, Top: targetDepth + t.Height))
            .Where(t => t.Top > depth + 1e-9)
            .OrderBy(t => t.Start)
            .ToList();

        var feedPending = true;
        var zState = depth; // current Z (mm)

        void DoMove(Vec to)
        {
            MoveTo(s, to, docx, docy, feedPending ? feedrate : null);
            feedPending = false;
        }

        void SetZ(double z)
        {
            if (Math.Abs(z - zState) > 1e-9)
            {
                PlungTo(s, z, plungerate);
                zState = z;
                feedPending = true;
            }
        }

        if (!loop.Closed)
        {
            for (var i = 1; i < pts.Count; i++) DoMove(pts[i]);
            return;
        }

        // Closed loop: walk the perimeter, splitting at tab boundaries.
        var n = pts.Count;
        var lengths = new double[n];
        var total = 0.0;
        for (var i = 0; i < n; i++)
        {
            var l = Geom.Dist(pts[i], pts[(i + 1) % n]);
            lengths[i] = l;
            total += l;
        }

        // If the loop starts inside a tab, lift immediately.
        var startTab = activeTabs
            .Where(t => t.Start <= 1e-9 && t.End > 1e-9)
            .Select(t => ((double Start, double End, double Top)?)t)
            .FirstOrDefault();
        if (startTab is { } st) SetZ(st.Top);

        var sPos = 0.0;
        for (var i = 0; i < n; i++)
        {
            var a = pts[i];
            var b = pts[(i + 1) % n];
            var segLen = lengths[i];
            var segStart = sPos;
            var segEnd = sPos + segLen;
            sPos = segEnd;

            // Gather split points inside this edge.
            var cuts = new List<(double At, bool Enter)>();
            foreach (var tab in activeTabs)
            {
                if (tab.Start > segStart + 1e-9 && tab.Start < segEnd - 1e-9)
                {
                    cuts.Add(((tab.Start - segStart) / segLen, true));
                }
                if (tab.End > segStart + 1e-9 && tab.End < segEnd - 1e-9)
                {
                    cuts.Add(((tab.End - segStart) / segLen, false));
                }
                // Tab starts exactly at this edge's start.
                if (Math.Abs(tab.Start - segStart) < 1e-9) cuts.Add((0, true));
                if (Math.Abs(tab.End - segStart) < 1e-9) cuts.Add((0, false));
            }
            cuts = cuts.OrderBy(c => c.At).ThenBy(c => c.Enter ? 0 : 1).ToList();

            var last = a;
            (double Start, double End, double Top)? TabAt(double pos) => activeTabs
                .Where(t => pos >= t.Start - 1e-9 && pos < t.End - 1e-9)
                .Select(t => ((double Start, double End, double Top)?)t)
                .FirstOrDefault();

            foreach (var cut in cuts)
            {
                var p = cut.At <= 1e-9
                    ? a
                    : cut.At >= 1 - 1e-9
                        ? b
                        : new Vec(a.X + (b.X - a.X) * cut.At, a.Y + (b.Y - a.Y) * cut.At);
                if (Geom.Dist(last, p) > 1e-9) DoMove(p);
                if (cut.Enter)
                {
                    var tab = TabAt(segStart + cut.At * segLen);
                    SetZ(tab is { } t ? t.Top : tabTop);
                }
                else
                {
                    SetZ(depth);
                }
                last = p;
            }

            // Move to the end of the edge.
            if (Geom.Dist(last, b) > 1e-9 || i == n - 1) DoMove(b);
        }

        // The closing edge already ended at pts[0] because of the modulo; just
        // make sure the cutter is at the cut depth.
        SetZ(depth);
    }

    private static void ProcessProfile(EmitState s, Operation op, IReadOnlyList<double> tools)
    {
        var p = op.Params;
        if (op.Loops.Count == 0) return;
        Emit(s, $"({CommentSafe(op.Name)})");

        foreach (var loop in op.Loops)
        {
            if (loop.Points.Count < 2) continue;
            Emit(s, $"G0 Z{FmtLength(p.SafetyHeight, s.Unit, s.Decimals)}");
            EnsureTool(s, op, tools);
            RapidTo(s, loop.Points[0], 0, 0);

            var depth = p.StockSurface;
            while (depth > p.TargetDepth + 1e-9)
            {
                depth = Math.Max(p.TargetDepth, depth - Math.Abs(p.Stepdown));
                depth = Math.Round(depth, 6, MidpointRounding.AwayFromZero);
                PlungTo(s, depth, p.PlungeRate);
                EmitLoop(s, loop, depth, p.TargetDepth, p.Feedrate, p.PlungeRate, 0, 0);
            }
        }
    }

    private static void ProcessPocket(EmitState s, Operation op, IReadOnlyList<double> tools)
    {
        var p = op.Params;
        if (op.Loops.Count == 0) return;
        Emit(s, $"({CommentSafe(op.Name)})");

        var depth = p.StockSurface;
        while (depth > p.TargetDepth + 1e-9)
        {
            depth = Math.Max(p.TargetDepth, depth - Math.Abs(p.Stepdown));
            depth = Math.Round(depth, 6, MidpointRounding.AwayFromZero);

            foreach (var loop in op.Loops)
            {
                if (loop.Points.Count < 2) continue;
                Emit(s, $"G0 Z{FmtLength(p.SafetyHeight, s.Unit, s.Decimals)}");
                EnsureTool(s, op, tools);
                RapidTo(s, loop.Points[0], 0, 0);
                PlungTo(s, depth, p.PlungeRate);
                EmitLoop(s, loop, depth, p.TargetDepth, p.Feedrate, p.PlungeRate, 0, 0);
            }
        }
    }

    private static void ProcessFollow(EmitState s, Operation op, IReadOnlyList<double> tools)
    {
        var p = op.Params;
        if (op.Loops.Count == 0) return;
        Emit(s, $"({CommentSafe(op.Name)})");

        foreach (var loop in op.Loops)
        {
            if (loop.Points.Count < 2) continue;
            var depth = p.StockSurface;
            while (depth > p.TargetDepth + 1e-9)
            {
                depth = Math.Max(p.TargetDepth, depth - Math.Abs(p.Stepdown));
                depth = Math.Round(depth, 6, MidpointRounding.AwayFromZero);
                Emit(s, $"G0 Z{FmtLength(p.SafetyHeight, s.Unit, s.Decimals)}");
                EnsureTool(s, op, tools);
                RapidTo(s, loop.Points[0], 0, 0);
                PlungTo(s, depth, p.PlungeRate);
                EmitLoop(s, loop, depth, p.TargetDepth, p.Feedrate, p.PlungeRate, 0, 0);
            }
        }
    }

    private static void ProcessDrill(EmitState s, Operation op, IReadOnlyList<double> tools)
    {
        var p = op.Params;
        if (op.DrillPoints.Count == 0) return;
        Emit(s, $"({CommentSafe(op.Name)})");

        foreach (var point in op.DrillPoints)
        {
            Emit(s, $"G0 Z{FmtLength(p.SafetyHeight, s.Unit, s.Decimals)}");
            EnsureTool(s, op, tools);
            RapidTo(s, point, 0, 0);
            var depth = p.StockSurface;
            while (depth > p.TargetDepth + 1e-9)
            {
                depth = Math.Max(p.TargetDepth, depth - Math.Abs(p.Stepdown));
                depth = Math.Round(depth, 6, MidpointRounding.AwayFromZero);
                PlungTo(s, depth, p.PlungeRate);
                // Peck: retract to the stock surface between passes.
                Emit(s, $"G1 Z{FmtLength(p.StockSurface, s.Unit, s.Decimals)} " +
                        $"F{FormatNumber(ConvertLength(p.PlungeRate, s.Unit), s.FeedDecimals)}");
            }
        }
    }

    public static string Generate(IReadOnlyList<Operation> ops, Unit unit, double tolerance = 0.01)
    {
        var processed = ops.Where(op => op.Processed).ToList();
        if (processed.Count == 0) return string.Empty;

        var tools = ToolList(processed);
        var s = new EmitState
        {
            Unit = unit,
            Decimals = DecimalsFor(unit, tolerance),
            FeedDecimals = unit == Unit.In ? 3 : 1,
            CurrentTool = -1,
            CutterOn = false,
        };

        Emit(s, "(Generated by MakerCam Modern, a port of PartKam by Jack Clark)");
        Emit(s, unit == Unit.In ? "G20 G90 G40" : "G21 G90 G40");
        Emit(s, "");

        foreach (var op in processed)
        {
            switch (op.Type)
            {
                case OperationType.Profile:
                    ProcessProfile(s, op, tools);
                    break;
                case OperationType.Pocket:
                    ProcessPocket(s, op, tools);
                    break;
                case OperationType.Follow:
                    ProcessFollow(s, op, tools);
                    break;
                case OperationType.Drill:
                case OperationType.DrillPath:
                    ProcessDrill(s, op, tools);
                    break;
            }
        }

        var lastSafety = processed.Count > 0 ? processed[^1].Params.SafetyHeight : 10;
        Emit(s, $"G0 Z{FmtLength(lastSafety, s.Unit, s.Decimals)}");
        Emit(s, "M5");
        Emit(s, "M30");
        return string.Concat(s.Lines);
    }

    /// <summary>Returns a rough machining-time estimate in minutes.</summary>
    public static double EstimateTime(Operation op)
    {
        var p = op.Params;
        var length = 0.0;
        foreach (var loop in op.Loops)
        {
            var n = loop.Points.Count;
            for (var i = 0; i < n; i++)
            {
                if (!loop.Closed && i == 0) continue;
                length += Geom.Dist(loop.Points[i], loop.Points[(i + 1) % n]);
            }
        }
        if (op.Type is OperationType.Drill or OperationType.DrillPath)
        {
            var depth = Math.Abs(p.TargetDepth - p.StockSurface);
            var pecks = Math.Max(1, Math.Ceiling(depth / Math.Abs(p.Stepdown == 0 ? 1 : p.Stepdown)));
            var perHole = pecks * 2 * depth;
            return op.DrillPoints.Count * perHole / Math.Max(p.PlungeRate, 1);
        }
        var cutDepth = Math.Abs(p.TargetDepth - p.StockSurface);
        var slices = Math.Max(1, Math.Ceiling(cutDepth / Math.Abs(p.Stepdown == 0 ? 1 : p.Stepdown)));
        var feed = Math.Max(p.Feedrate, 1);
        return length * slices / feed +
               slices * Math.Max(1, op.Loops.Count) * 2 * p.SafetyHeight / 2000;
    }
}
