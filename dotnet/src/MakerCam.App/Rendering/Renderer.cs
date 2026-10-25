using System.Globalization;
using System.Windows;
using System.Windows.Media;
using MakerCam.Core;
using LineSegment = MakerCam.Core.LineSegment;

namespace MakerCam.App;

public sealed class RenderOptions
{
    public IReadOnlyList<Path> Paths { get; set; } = Array.Empty<Path>();
    public IReadOnlyList<Operation> Operations { get; set; } = Array.Empty<Operation>();
    public HashSet<string> Selection { get; set; } = new();
    public string? SelectedOperationId { get; set; }
    public View View { get; set; } = View.Default;
    public Unit Unit { get; set; } = Unit.Mm;
    public bool Grid { get; set; } = true;
    public bool ShowToolpaths { get; set; } = true;
    public bool ShowToolDiameter { get; set; }
    public string? HoverPathId { get; set; }
    public Rect? RubberBand { get; set; }
    public IReadOnlyList<Vec>? PenPreview { get; set; }
    public Vec? PenCursor { get; set; }
    public Tool Tool { get; set; } = Tool.Select;
}

/// <summary>Canvas renderer, ported from <c>render.ts</c>.</summary>
public static class Renderer
{
    private static readonly Color Bg = Hex("#fafaf7");
    private static readonly Color GridMinor = Hex("#ecece4");
    private static readonly Color GridMajor = Hex("#dcdcd0");
    private static readonly Color AxisColor = Hex("#c2c2b4");
    private static readonly Color PathColor = Hex("#343d49");
    private static readonly Color PathHover = Hex("#1d6fb8");
    private static readonly Color PathSelected = Hex("#0a84ff");
    private static readonly Color PathReferenced = Hex("#8a97a6");
    private static readonly Color ProfileColor = Hex("#12824c");
    private static readonly Color PocketColor = Hex("#c77c08");
    private static readonly Color FollowColor = Hex("#7c3aed");
    private static readonly Color DrillColor = Hex("#d62828");
    private static readonly Color DrillPathColor = Hex("#be185d");
    private static readonly Color TabColor = Hex("#0f766e");
    private static readonly Color GridLabel = Hex("#8b8b7d");
    private static readonly Color BandFill = Color.FromArgb(31, 10, 132, 255);
    private static readonly Color BandStroke = Color.FromArgb(204, 10, 132, 255);

    private static readonly Typeface UiTypeface = new(
        new FontFamily("Segoe UI"),
        FontStyles.Normal,
        FontWeights.Normal,
        FontStretches.Normal);

    private static SolidColorBrush Brush(Color c)
    {
        var b = new SolidColorBrush(c);
        b.Freeze();
        return b;
    }

    private static Pen Pen(Color c, double width = 1)
    {
        var p = new Pen(Brush(c), width)
        {
            StartLineCap = PenLineCap.Round,
            EndLineCap = PenLineCap.Round,
            LineJoin = PenLineJoin.Round,
        };
        p.Freeze();
        return p;
    }

    private static Color Hex(string hex)
    {
        return (Color)ColorConverter.ConvertFromString(hex);
    }

    private static Color OpColor(OperationType type) => type switch
    {
        OperationType.Profile => ProfileColor,
        OperationType.Pocket => PocketColor,
        OperationType.Follow => FollowColor,
        OperationType.DrillPath => DrillPathColor,
        _ => DrillColor,
    };

    private static Point S(View view, Vec p)
    {
        var q = ViewMath.WorldToScreen(view, p);
        return new Point(q.X, q.Y);
    }

    public static void Render(DrawingContext dc, Size size, RenderOptions o, double pixelsPerDip)
    {
        var w = Math.Max(1, size.Width);
        var h = Math.Max(1, size.Height);
        var full = new Rect(0, 0, w, h);
        dc.DrawRectangle(Brush(Bg), null, full);

        if (o.Grid) DrawGrid(dc, o.View, w, h, o.Unit, pixelsPerDip);

        // Paths referenced by the selected operation get a subtle highlight.
        var referenced = new HashSet<string>();
        var selectedOp = o.Operations.FirstOrDefault(op => op.Id == o.SelectedOperationId);
        if (selectedOp is not null)
        {
            foreach (var id in selectedOp.PathIds) referenced.Add(id);
        }

        foreach (var path in o.Paths)
        {
            var isSelected = path.Id is not null && o.Selection.Contains(path.Id);
            var isHover = path.Id == o.HoverPathId;
            var isReferenced = path.Id is not null && referenced.Contains(path.Id);

            var geometry = BuildPathGeometry(path, o.View);
            if (geometry is null) continue;

            var color = isSelected
                ? PathSelected
                : isHover
                    ? PathHover
                    : isReferenced
                        ? PathReferenced
                        : PathColor;
            dc.DrawGeometry(null, Pen(color, isSelected ? 2.4 : 1.6), geometry);

            // Endpoint dots for selected paths.
            if (isSelected)
            {
                var brush = Brush(PathSelected);
                foreach (var seg in path.Segments)
                {
                    dc.DrawEllipse(brush, null, S(o.View, seg.P1), 2.6, 2.6);
                }
            }
        }

        if (o.ShowToolpaths)
        {
            foreach (var op in o.Operations)
            {
                if (!op.Visible || !op.Processed) continue;
                var color = OpColor(op.Type);
                var isSel = op.Id == o.SelectedOperationId;

                foreach (var loop in op.Loops)
                {
                    if (loop.Points.Count == 0) continue;
                    var geometry = BuildLoopGeometry(loop.Points, loop.Closed, o.View);

                    // Tool diameter ghost
                    if (o.ShowToolDiameter && op.Params.ToolDiameter > 0)
                    {
                        var width = Math.Max(1, op.Params.ToolDiameter * o.View.Zoom);
                        dc.DrawGeometry(null, Pen(WithAlpha(color, isSel ? 0.18 : 0.1), width), geometry);
                    }

                    dc.DrawGeometry(null, Pen(color, isSel ? 2.6 : 1.8), geometry);

                    if (isSel)
                    {
                        DrawDirectionArrows(dc, loop, o.View, color);
                        DrawTabMarks(dc, loop, o.View);
                    }

                    // Start marker
                    var start = S(o.View, loop.Points[0]);
                    var radius = isSel ? 4 : 3;
                    dc.DrawEllipse(
                        isSel ? Brush(color) : Brush(Colors.White),
                        Pen(color, 1.5),
                        start,
                        radius,
                        radius);
                }

                foreach (var point in op.DrillPoints)
                {
                    var center = S(o.View, point);
                    var r = Math.Max(2, op.Params.ToolDiameter / 2 * o.View.Zoom);
                    dc.DrawEllipse(
                        Brush(WithAlpha(color, isSel ? 0.35 : 0.2)),
                        Pen(color, isSel ? 2 : 1.4),
                        center,
                        r,
                        r);

                    var cross = Pen(color, isSel ? 2 : 1.4);
                    dc.DrawLine(cross,
                        new Point(center.X - r * 0.5, center.Y),
                        new Point(center.X + r * 0.5, center.Y));
                    dc.DrawLine(cross,
                        new Point(center.X, center.Y - r * 0.5),
                        new Point(center.X, center.Y + r * 0.5));
                }
            }
        }

        // Pen preview
        if (o.PenPreview is { Count: > 0 } preview)
        {
            var points = new List<Point>(preview.Count + 1);
            foreach (var p in preview) points.Add(S(o.View, p));
            if (o.PenCursor is { } cursor) points.Add(S(o.View, cursor));

            var pen = new Pen(Brush(PathSelected), 1.8)
            {
                DashStyle = new DashStyle(new[] { 5 / 1.8, 4 / 1.8 }, 0),
                StartLineCap = PenLineCap.Round,
                EndLineCap = PenLineCap.Round,
            };
            pen.Freeze();
            for (var i = 1; i < points.Count; i++)
            {
                dc.DrawLine(pen, points[i - 1], points[i]);
            }

            var dot = Brush(PathSelected);
            foreach (var p in preview) dc.DrawEllipse(dot, null, S(o.View, p), 3, 3);
        }

        // Rubber band
        if (o.RubberBand is { } band)
        {
            var rect = new Rect(
                Math.Min(band.X, band.X + band.Width),
                Math.Min(band.Y, band.Y + band.Height),
                Math.Abs(band.Width),
                Math.Abs(band.Height));
            dc.DrawRectangle(Brush(BandFill), Pen(BandStroke, 1), rect);
        }
    }

    /* -------------------------------------------------------------- */
    /* Grid                                                            */
    /* -------------------------------------------------------------- */

    private static void DrawGrid(
        DrawingContext dc,
        View view,
        double width,
        double height,
        Unit unit,
        double pixelsPerDip)
    {
        // Choose a grid step that stays readable at any zoom.
        var baseMm = unit == Unit.In ? 25.4 : 1;
        const double targetPx = 14;
        var step = baseMm;
        var mult = new[] { 1, 2, 5, 10 };
        var guard = 0;
        while (step * view.Zoom < targetPx && guard++ < 40)
        {
            var decade = Math.Pow(10, Math.Floor(Math.Log10(step / baseMm)));
            var idx = Array.FindIndex(mult, m => Math.Abs(m * decade * baseMm - step) < 1e-9);
            var next = idx >= 0 && idx < mult.Length - 1
                ? mult[idx + 1] * decade * baseMm
                : step * 2;
            step = next;
        }
        while (step * view.Zoom > targetPx * 12 && guard++ < 40)
        {
            step /= 2;
        }

        const int majorEvery = 10;
        var worldLeft = (0 - view.PanX) / view.Zoom;
        var worldRight = (width - view.PanX) / view.Zoom;
        var worldBottom = (view.PanY - height) / view.Zoom;
        var worldTop = view.PanY / view.Zoom;

        // Minor lines
        var minor = Pen(GridMinor, 1);
        var startX = Math.Ceiling(worldLeft / step) * step;
        for (var x = startX; x <= worldRight; x += step)
        {
            var sx = Math.Round(view.PanX + x * view.Zoom) + 0.5;
            dc.DrawLine(minor, new Point(sx, 0), new Point(sx, height));
        }
        var startY = Math.Ceiling(worldBottom / step) * step;
        for (var y = startY; y <= worldTop; y += step)
        {
            var sy = Math.Round(view.PanY - y * view.Zoom) + 0.5;
            dc.DrawLine(minor, new Point(0, sy), new Point(width, sy));
        }

        // Major lines
        var major = step * majorEvery;
        var majorPen = Pen(GridMajor, 1);
        var startXM = Math.Ceiling(worldLeft / major) * major;
        for (var x = startXM; x <= worldRight; x += major)
        {
            var sx = Math.Round(view.PanX + x * view.Zoom) + 0.5;
            dc.DrawLine(majorPen, new Point(sx, 0), new Point(sx, height));
        }
        var startYM = Math.Ceiling(worldBottom / major) * major;
        for (var y = startYM; y <= worldTop; y += major)
        {
            var sy = Math.Round(view.PanY - y * view.Zoom) + 0.5;
            dc.DrawLine(majorPen, new Point(0, sy), new Point(width, sy));
        }

        // Axes
        var axis = Pen(AxisColor, 1.5);
        var axisX = Math.Round(view.PanX) + 0.5;
        var axisY = Math.Round(view.PanY) + 0.5;
        if (axisX >= 0 && axisX <= width) dc.DrawLine(axis, new Point(axisX, 0), new Point(axisX, height));
        if (axisY >= 0 && axisY <= height) dc.DrawLine(axis, new Point(0, axisY), new Point(width, axisY));

        // Grid labels in the display unit.
        var worldPerUnit = unit == Unit.In ? 25.4 : 1;
        var labelBrush = Brush(GridLabel);
        var labelEvery = major * 2;
        var labelStartX = Math.Ceiling(worldLeft / labelEvery) * labelEvery;
        for (var x = labelStartX; x <= worldRight; x += labelEvery)
        {
            var sx = view.PanX + x * view.Zoom;
            if (sx < 24 || sx > width - 24) continue;
            var text = Text(FmtCoord(x / worldPerUnit), labelBrush, 11, pixelsPerDip);
            dc.DrawText(text, new Point(sx + 3, Math.Min(Math.Max(axisY + 3, 3), height - 16)));
        }
        var labelStartY = Math.Ceiling(worldBottom / labelEvery) * labelEvery;
        for (var y = labelStartY; y <= worldTop; y += labelEvery)
        {
            var sy = view.PanY - y * view.Zoom;
            if (sy < 14 || sy > height - 14) continue;
            var text = Text(FmtCoord(y / worldPerUnit), labelBrush, 11, pixelsPerDip);
            dc.DrawText(text, new Point(Math.Min(Math.Max(axisX + 4, 4), width - 40), sy + 2));
        }
    }

    private static string FmtCoord(double n)
    {
        var v = Math.Abs(n) < 1e-9 ? 0 : n;
        return v == Math.Truncate(v)
            ? v.ToString("0", CultureInfo.InvariantCulture)
            : v.ToString("F2", CultureInfo.InvariantCulture);
    }

    /* -------------------------------------------------------------- */
    /* Geometry                                                        */
    /* -------------------------------------------------------------- */

    private static void AddSegment(StreamGeometryContext ctx, Segment seg, View view)
    {
        switch (seg)
        {
            case LineSegment line:
                ctx.LineTo(S(view, line.P2), true, false);
                break;
            case QuadSegment quad:
                ctx.QuadraticBezierTo(S(view, quad.C), S(view, quad.P2), true, false);
                break;
            case CubicSegment cubic:
                ctx.BezierTo(S(view, cubic.C1), S(view, cubic.C2), S(view, cubic.P2), true, false);
                break;
        }
    }

    public static StreamGeometry? BuildPathGeometry(Path path, View view)
    {
        if (path.Segments.Count == 0) return null;

        // Split into figures at gaps, matching canvas moveTo/closePath behaviour.
        var figures = new List<(Vec Start, List<Segment> Segments)>();
        foreach (var seg in path.Segments)
        {
            if (figures.Count == 0 || Geom.Dist(figures[^1].Segments[^1].P2, seg.P1) > 1e-6)
            {
                figures.Add((seg.P1, new List<Segment>()));
            }
            figures[^1].Segments.Add(seg);
        }

        var geometry = new StreamGeometry();
        using (var ctx = geometry.Open())
        {
            for (var i = 0; i < figures.Count; i++)
            {
                var (start, segs) = figures[i];
                ctx.BeginFigure(S(view, start), false, path.Closed && i == figures.Count - 1);
                foreach (var seg in segs) AddSegment(ctx, seg, view);
            }
        }
        geometry.Freeze();
        return geometry;
    }

    public static StreamGeometry BuildLoopGeometry(IReadOnlyList<Vec> points, bool closed, View view)
    {
        var geometry = new StreamGeometry();
        using (var ctx = geometry.Open())
        {
            if (points.Count > 0)
            {
                ctx.BeginFigure(S(view, points[0]), false, closed);
                for (var i = 1; i < points.Count; i++)
                {
                    ctx.LineTo(S(view, points[i]), true, false);
                }
            }
        }
        geometry.Freeze();
        return geometry;
    }

    private static void DrawDirectionArrows(
        DrawingContext dc,
        Loop loop,
        View view,
        Color color,
        double everyPx = 90)
    {
        var pts = loop.Points;
        if (pts.Count < 2) return;
        var travelled = 0.0;
        var nextArrow = 0.0;
        var limit = pts.Count - (loop.Closed ? 0 : 1);
        var brush = Brush(color);

        for (var i = 0; i < limit; i++)
        {
            var a = pts[i];
            var b = pts[(i + 1) % pts.Count];
            var segLen = Geom.Dist(a, b) * view.Zoom;
            if (travelled + segLen >= nextArrow && segLen > 1)
            {
                var t = segLen > 0 ? Math.Min(1, (nextArrow - travelled) / segLen) : 0;
                var p = new Vec(a.X + (b.X - a.X) * t, a.Y + (b.Y - a.Y) * t);
                var dir = new Vec(b.X - a.X, b.Y - a.Y);
                var len = Geom.Hypot(dir.X, dir.Y);
                if (len == 0) len = 1;
                var ux = dir.X / len;
                var uy = dir.Y / len;
                var s = ViewMath.WorldToScreen(view, p);
                const double size = 5;

                var geometry = new StreamGeometry();
                using (var ctx = geometry.Open())
                {
                    ctx.BeginFigure(new Point(s.X + ux * size, s.Y - uy * size), true, true);
                    ctx.LineTo(new Point(s.X - uy * size * 0.6, s.Y - ux * size * 0.6), true, false);
                    ctx.LineTo(new Point(s.X + uy * size * 0.6, s.Y + ux * size * 0.6), true, false);
                }
                geometry.Freeze();
                dc.DrawGeometry(brush, null, geometry);
                nextArrow += everyPx;
            }
            travelled += segLen;
        }
    }

    private static void DrawTabMarks(DrawingContext dc, Loop loop, View view)
    {
        if (loop.Tabs.Count == 0) return;
        var pts = loop.Points;
        var n = pts.Count;
        if (n < 2) return;

        var lengths = new double[n];
        for (var i = 0; i < n; i++) lengths[i] = Geom.Dist(pts[i], pts[(i + 1) % n]);

        var pen = Pen(TabColor, 2.5);
        foreach (var tab in loop.Tabs)
        {
            var center = tab.Start + tab.Width / 2;
            var acc = 0.0;
            for (var i = 0; i < n; i++)
            {
                if (acc <= center && center <= acc + lengths[i])
                {
                    var t = lengths[i] > 0 ? (center - acc) / lengths[i] : 0;
                    var a = pts[i];
                    var b = pts[(i + 1) % n];
                    var p = new Vec(a.X + (b.X - a.X) * t, a.Y + (b.Y - a.Y) * t);
                    var s = ViewMath.WorldToScreen(view, p);
                    var dir = new Vec(b.X - a.X, b.Y - a.Y);
                    var len = Geom.Hypot(dir.X, dir.Y);
                    if (len == 0) len = 1;
                    var nx = -dir.Y / len;
                    var ny = dir.X / len;
                    const double size = 6;
                    dc.DrawLine(
                        pen,
                        new Point(s.X - nx * size, s.Y + ny * size),
                        new Point(s.X + nx * size, s.Y - ny * size));
                    break;
                }
                acc += lengths[i];
            }
        }
    }

    private static FormattedText Text(string text, Brush brush, double size, double pixelsPerDip) =>
        new(
            text,
            CultureInfo.InvariantCulture,
            FlowDirection.LeftToRight,
            UiTypeface,
            size,
            brush,
            pixelsPerDip);

    private static Color WithAlpha(Color c, double alpha) =>
        Color.FromArgb((byte)Math.Round(alpha * 255), c.R, c.G, c.B);

    /* -------------------------------------------------------------- */
    /* Bounds                                                          */
    /* -------------------------------------------------------------- */

    /// <summary>Returns the world bounds of all drawing paths, or null.</summary>
    public static Bounds? ContentBounds(IEnumerable<Path> paths)
    {
        Bounds? b = null;
        foreach (var path in paths)
        {
            var pts = Geom.FlattenPath(path, 0.05);
            if (pts.Count == 0) continue;
            var pb = Geom.PolygonBounds(pts);
            b = b is { } current
                ? new Bounds(
                    Math.Min(current.MinX, pb.MinX),
                    Math.Min(current.MinY, pb.MinY),
                    Math.Max(current.MaxX, pb.MaxX),
                    Math.Max(current.MaxY, pb.MaxY))
                : pb;
        }
        return b;
    }
}
