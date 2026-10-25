using System.Globalization;
using System.Text;
using System.Xml;
using System.Xml.Linq;

namespace MakerCam.Core;

public sealed class ProjectData
{
    public List<Path> Paths { get; init; } = new();
    public List<OpDefinition> Operations { get; init; } = new();
    public Unit Unit { get; set; } = Unit.Mm;
    public double WidthMm { get; set; }
    public double HeightMm { get; set; }
    public List<string> Warnings { get; init; } = new();
}

/// <summary>
/// Project persistence.
///
/// Projects are ordinary SVG files with a &lt;metadata&gt; section describing
/// the CAM operations. Saved files open in any SVG viewer, and files written by
/// the original Flash MakerCam/PartKam can be loaded as well.
/// </summary>
public static class ProjectIO
{
    private static readonly string[] ParamKeys =
    {
        "toolDiameter", "targetDepth", "safetyHeight", "stockSurface", "stepdown",
        "feedrate", "plungerate", "outside", "direction", "stepover",
        "roughingClearance", "center", "spacing", "holeCount", "tabSpacing", "tabWidth", "tabHeight",
    };

    private static string EscapeXml(string s) => s
        .Replace("&", "&amp;")
        .Replace("<", "&lt;")
        .Replace(">", "&gt;")
        .Replace("\"", "&quot;")
        .Replace("'", "&apos;");

    private static double Round(double n, int decimals = 4)
    {
        var f = Math.Pow(10, decimals);
        return JsMath.Round(n * f) / f;
    }

    private static string RoundText(double n, int decimals = 4) => JsMath.FormatShort(Round(n, decimals));

    private static Bounds AllBounds(IReadOnlyList<Path> paths)
    {
        Bounds? b = null;
        foreach (var p in paths)
        {
            foreach (var q in Geom.FlattenPath(p, 0.05))
            {
                if (b is not { } current)
                {
                    b = new Bounds(q.X, q.Y, q.X, q.Y);
                }
                else
                {
                    b = new Bounds(
                        Math.Min(current.MinX, q.X),
                        Math.Min(current.MinY, q.Y),
                        Math.Max(current.MaxX, q.X),
                        Math.Max(current.MaxY, q.Y));
                }
            }
        }
        return b ?? Bounds.Empty;
    }

    private static object GetParam(OperationParams p, string key) => key switch
    {
        "toolDiameter" => p.ToolDiameter,
        "targetDepth" => p.TargetDepth,
        "safetyHeight" => p.SafetyHeight,
        "stockSurface" => p.StockSurface,
        "stepdown" => p.Stepdown,
        "feedrate" => p.Feedrate,
        "plungerate" => p.PlungeRate,
        "outside" => p.Outside,
        "direction" => (double)(int)p.Direction,
        "stepover" => p.Stepover,
        "roughingClearance" => p.RoughingClearance,
        "center" => p.Center,
        "spacing" => p.Spacing,
        "holeCount" => (double)p.HoleCount,
        "tabSpacing" => p.TabSpacing,
        "tabWidth" => p.TabWidth,
        "tabHeight" => p.TabHeight,
        _ => throw new ArgumentOutOfRangeException(nameof(key)),
    };

    private static void SetParam(OperationParams p, string key, XElement el)
    {
        var attr = XmlUtil.Attr(el, key);
        if (attr is null) return;
        switch (key)
        {
            case "outside":
                p.Outside = attr == "true";
                break;
            case "center":
                p.Center = attr == "true";
                break;
            case "direction":
                p.Direction = attr == "2" ? Direction.Clockwise
                    : attr == "1" ? Direction.CounterClockwise
                    : p.Direction;
                break;
            default:
            {
                if (double.TryParse(attr, NumberStyles.Float, CultureInfo.InvariantCulture, out var n) &&
                    double.IsFinite(n))
                {
                    switch (key)
                    {
                        case "toolDiameter": p.ToolDiameter = n; break;
                        case "targetDepth": p.TargetDepth = n; break;
                        case "safetyHeight": p.SafetyHeight = n; break;
                        case "stockSurface": p.StockSurface = n; break;
                        case "stepdown": p.Stepdown = n; break;
                        case "feedrate": p.Feedrate = n; break;
                        case "plungerate": p.PlungeRate = n; break;
                        case "stepover": p.Stepover = n; break;
                        case "roughingClearance": p.RoughingClearance = n; break;
                        case "spacing": p.Spacing = n; break;
                        case "holeCount": p.HoleCount = (int)n; break;
                        case "tabSpacing": p.TabSpacing = n; break;
                        case "tabWidth": p.TabWidth = n; break;
                        case "tabHeight": p.TabHeight = n; break;
                    }
                }
                break;
            }
        }
    }

    public static string SerializeProject(
        IReadOnlyList<Path> paths,
        IReadOnlyList<OpDefinition> operations,
        Unit unit = Unit.Mm,
        double? pageWidthMm = null,
        double? pageHeightMm = null)
    {
        double w;
        double h;
        Func<Vec, Vec> map;

        if (pageWidthMm is { } pageW && pageHeightMm is { } pageH &&
            pageW > 0 && pageH > 0 && double.IsFinite(pageW) && double.IsFinite(pageH))
        {
            // Keep the imported document page. One SVG user unit is one
            // millimetre, and the model's Y-up origin maps to the page's
            // bottom edge.
            w = Math.Max(Round(pageW), 0.001);
            h = Math.Max(Round(pageH), 0.001);
            map = p => new Vec(p.X, h - p.Y);
        }
        else
        {
            // Documents created from scratch have no page: fit it to content.
            var b = AllBounds(paths);
            w = Math.Max(b.MaxX - b.MinX, 0.001);
            h = Math.Max(b.MaxY - b.MinY, 0.001);
            map = p => new Vec(p.X - b.MinX, b.MaxY - p.Y);
        }

        var lines = new List<string>
        {
            "<?xml version=\"1.0\" encoding=\"UTF-8\"?>",
            $"<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"{RoundText(w)}mm\" height=\"{RoundText(h)}mm\" viewBox=\"0 0 {RoundText(w)} {RoundText(h)}\">",
            "  <metadata>",
            $"    <partkam-project version=\"2\" unit=\"mm\" width=\"{RoundText(w)}\" height=\"{RoundText(h)}\">",
        };

        foreach (var op in operations)
        {
            var attrs = new List<string>
            {
                $"id=\"{EscapeXml(op.Id ?? string.Empty)}\"",
                $"type=\"{Units.ToCode(op.Type)}\"",
                $"name=\"{EscapeXml(op.Name)}\"",
            };
            foreach (var key in ParamKeys)
            {
                var v = GetParam(op.Params, key);
                if (v is bool flag) attrs.Add($"{key}=\"{(flag ? "true" : "false")}\"");
                else if (v is double number && double.IsFinite(number))
                    attrs.Add($"{key}=\"{RoundText(number, 6)}\"");
            }
            lines.Add($"      <partkam-operation {string.Join(" ", attrs)}>");
            foreach (var pathId in op.PathIds)
            {
                lines.Add($"        <partkam-path ref=\"{EscapeXml(pathId)}\"/>");
            }
            lines.Add("      </partkam-operation>");
        }

        lines.Add("    </partkam-project>");
        lines.Add("  </metadata>");
        lines.Add("  <!-- Generated by MakerCam Modern (a port of PartKam by Jack Clark) -->");
        foreach (var p in paths)
        {
            var id = string.IsNullOrEmpty(p.Id) ? "path" : p.Id;
            var d = SvgImporter.PathToSvgD(p, map);
            if (string.IsNullOrEmpty(d)) continue;
            lines.Add(
                $"  <path id=\"{EscapeXml(id)}\" d=\"{EscapeXml(d)}\" fill=\"none\" stroke=\"#000000\" stroke-width=\"0.2\"/>");
        }
        lines.Add("</svg>");
        return string.Join("\n", lines);
    }

    private static double ReadNumber(XElement el, string name, double fallback)
    {
        var v = XmlUtil.Attr(el, name);
        if (string.IsNullOrEmpty(v)) return fallback;
        return double.TryParse(v, NumberStyles.Float, CultureInfo.InvariantCulture, out var n) &&
               double.IsFinite(n)
            ? n
            : fallback;
    }

    private static bool ReadBoolean(XElement el, string name, bool fallback)
    {
        var v = XmlUtil.Attr(el, name);
        if (v is null) return fallback;
        return v == "true";
    }

    private static Direction ReadDirection(XElement el, Direction fallback)
    {
        var v = XmlUtil.Attr(el, "direction");
        return v == "2" ? Direction.Clockwise
            : v == "1" ? Direction.CounterClockwise
            : fallback;
    }

    private static Dictionary<string, List<Path>> PathMapBySource(IReadOnlyList<Path> paths)
    {
        var map = new Dictionary<string, List<Path>>(StringComparer.Ordinal);
        foreach (var p in paths)
        {
            foreach (var key in new[] { p.Id, p.SourceId, p.Name })
            {
                if (string.IsNullOrEmpty(key)) continue;
                if (!map.TryGetValue(key, out var list))
                {
                    list = new List<Path>();
                    map[key] = list;
                }
                list.Add(p);
            }
        }
        return map;
    }

    /// <summary>Parses a project file. Returns null if the SVG has no MakerCam metadata.</summary>
    public static ProjectData? ParseProject(string text, SvgImportOptions? options = null)
    {
        var imported = SvgImporter.ParseSvg(text, options);

        XDocument doc;
        try
        {
            doc = XDocument.Parse(text, LoadOptions.None);
        }
        catch (XmlException)
        {
            return null;
        }

        var allElements = doc.Descendants().ToList();
        if (!allElements.Any(el => XmlUtil.LocalName(el) == "metadata")) return null;

        var projectEl = allElements.FirstOrDefault(el => XmlUtil.LocalName(el) == "partkam-project");
        var pathMap = PathMapBySource(imported.Paths);
        var warnings = new List<string>(imported.Warnings);

        if (projectEl is not null)
        {
            var operations = new List<OpDefinition>();
            var opEls = projectEl.Descendants()
                .Where(el => XmlUtil.LocalName(el) == "partkam-operation")
                .ToList();

            foreach (var el in opEls)
            {
                var type = Units.ParseOperationType(XmlUtil.Attr(el, "type") ?? "profile");
                var opParams = OperationParams.Defaults(Unit.Mm);
                foreach (var key in ParamKeys) SetParam(opParams, key, el);

                var refs = el.Descendants()
                    .Where(c => XmlUtil.LocalName(c) == "partkam-path")
                    .Select(c => XmlUtil.Attr(c, "ref") ?? string.Empty)
                    .Where(r => !string.IsNullOrEmpty(r))
                    .ToList();

                var pathIds = new List<string>();
                foreach (var reference in refs)
                {
                    if (pathMap.TryGetValue(reference, out var found) && found.Count > 0)
                    {
                        foreach (var p in found)
                        {
                            if (!string.IsNullOrEmpty(p.Id) && !pathIds.Contains(p.Id)) pathIds.Add(p.Id);
                        }
                    }
                    else
                    {
                        warnings.Add(
                            $"Saved operation \"{XmlUtil.Attr(el, "name") ?? string.Empty}\" references a missing path.");
                    }
                }

                var id = XmlUtil.Attr(el, "id");
                operations.Add(new OpDefinition
                {
                    Id = string.IsNullOrEmpty(id) ? $"op{operations.Count + 1}" : id,
                    Type = type,
                    Name = XmlUtil.Attr(el, "name") ?? $"{Units.ToCode(type)} {operations.Count + 1}",
                    Params = opParams,
                    PathIds = pathIds,
                });
            }

            return new ProjectData
            {
                Paths = imported.Paths,
                Operations = operations,
                Unit = Unit.Mm,
                WidthMm = imported.WidthMm,
                HeightMm = imported.HeightMm,
                Warnings = warnings,
            };
        }

        // Original MakerCam/PartKam metadata: <metadata><cutobject ...>
        var cutEls = allElements.Where(el => XmlUtil.LocalName(el) == "cutobject").ToList();
        if (cutEls.Count == 0) return null;

        var legacyOperations = new List<OpDefinition>();
        foreach (var el in cutEls)
        {
            var type = Units.ParseOperationType(XmlUtil.Attr(el, "type") ?? "profile");
            var sourceUnit = (XmlUtil.Attr(el, "unit") ?? "imperial").ToLowerInvariant();
            var metric = sourceUnit == "metric";
            var opParams = OperationParams.Defaults(Unit.Mm);

            // Original internal units: inch or cm for lengths; machining values
            // are inch (imperial) or mm (metric).
            var machScale = metric ? 1 : 25.4; // machining params -> mm
            var toolScale = metric ? 10 : 25.4; // cm or inch -> mm

            static double NonZero(double x) => x == 0 || double.IsNaN(x) ? 1 : x;

            opParams.SafetyHeight = ReadNumber(el, "safetyheight", 0) * machScale;
            opParams.StockSurface = ReadNumber(el, "stocksurface", 0) * machScale;
            opParams.TargetDepth = ReadNumber(el, "targetdepth", 0) * machScale;
            opParams.Stepdown = NonZero(Math.Abs(ReadNumber(el, "stepdown", 1)) * machScale);
            opParams.Feedrate = NonZero(Math.Abs(ReadNumber(el, "feedrate", 1)) * machScale);
            opParams.PlungeRate = NonZero(Math.Abs(ReadNumber(el, "plungerate", 1)) * machScale);
            opParams.ToolDiameter = Math.Abs(ReadNumber(el, "tooldiameter", 1)) * toolScale;
            opParams.RoughingClearance = Math.Abs(ReadNumber(el, "roughingclearance", 0)) * toolScale;
            opParams.Stepover = Math.Abs(ReadNumber(el, "stepover", 0.4));
            if (opParams.Stepover > 1) opParams.Stepover /= 100;
            opParams.Outside = ReadBoolean(el, "outside", true);
            opParams.Direction = ReadDirection(el, Direction.CounterClockwise);
            opParams.Center = ReadBoolean(el, "center", true);
            opParams.Spacing = Math.Abs(ReadNumber(el, "spacing", 0)) * toolScale;
            opParams.TabSpacing = 0;
            opParams.TabWidth = 0;
            opParams.TabHeight = 0;

            var refs = el.Descendants()
                .Where(c => XmlUtil.LocalName(c) == "path")
                .Select(c => c.Value.Trim())
                .Where(r => !string.IsNullOrEmpty(r))
                .ToList();

            var pathIds = new List<string>();
            foreach (var reference in refs)
            {
                if (pathMap.TryGetValue(reference, out var found))
                {
                    foreach (var p in found)
                    {
                        if (!string.IsNullOrEmpty(p.Id) && !pathIds.Contains(p.Id)) pathIds.Add(p.Id);
                    }
                }
            }

            legacyOperations.Add(new OpDefinition
            {
                Id = $"op{legacyOperations.Count + 1}",
                Type = type,
                Name = XmlUtil.Attr(el, "name") ?? $"{Units.ToCode(type)} {legacyOperations.Count + 1}",
                Params = opParams,
                PathIds = pathIds,
            });
        }

        return new ProjectData
        {
            Paths = imported.Paths,
            Operations = legacyOperations,
            Unit = Unit.Mm,
            WidthMm = imported.WidthMm,
            HeightMm = imported.HeightMm,
            Warnings = warnings,
        };
    }
}
