using System.Globalization;
using System.Text.RegularExpressions;
using System.Xml;
using System.Xml.Linq;

namespace MakerCam.Core;

public sealed class SvgImportOptions
{
    /// <summary>Resolution used for CSS px and unitless SVG user units.</summary>
    public double PxPerInch { get; set; } = 96;

    /// <summary>Flattening tolerance for the resulting CAM paths (mm).</summary>
    public double Tolerance { get; set; } = 0.02;
}

public sealed class SvgImportResult
{
    public List<Path> Paths { get; init; } = new();
    public List<string> Warnings { get; init; } = new();
    public double WidthMm { get; set; }
    public double HeightMm { get; set; }
    public double SourceWidth { get; set; }
    public double SourceHeight { get; set; }
    public bool HasViewBox { get; set; }
}

/// <summary>
/// SVG import: parses SVG paths and basic shapes into the app's millimetre,
/// Y-up path model. Group transforms, viewBox scaling and physical units are
/// honoured.
/// </summary>
public static class SvgImporter
{
    private const double MmPerInch = 25.4;

    internal const string NumberPattern = @"[+-]?(?:(?:\d+\.?\d*)|(?:\.\d+))(?:[eE][+-]?\d+)?";

    private static readonly Regex LengthRegex = new(
        "^(" + NumberPattern + @")\s*([a-zA-Z%]*)$",
        RegexOptions.Compiled | RegexOptions.CultureInvariant);

    private static readonly Regex TransformRegex = new(
        @"(matrix|translate|scale|rotate|skewX|skewY)\s*\(([^)]*)\)",
        RegexOptions.Compiled | RegexOptions.CultureInvariant);

    private static readonly Regex NumberRegex = new(
        NumberPattern, RegexOptions.Compiled | RegexOptions.CultureInvariant);

    private static readonly Regex StyleTransformRegex = new(
        @"(?:^|;)\s*transform\s*:\s*([^;]+)",
        RegexOptions.Compiled | RegexOptions.IgnoreCase | RegexOptions.CultureInvariant);

    private static readonly Regex DisplayNoneRegex = new(
        @"(?:^|;)\s*display\s*:\s*none\b",
        RegexOptions.Compiled | RegexOptions.IgnoreCase | RegexOptions.CultureInvariant);

    private static readonly Regex VisibilityHiddenRegex = new(
        @"(?:^|;)\s*visibility\s*:\s*hidden\b",
        RegexOptions.Compiled | RegexOptions.IgnoreCase | RegexOptions.CultureInvariant);

    private static readonly HashSet<string> SkippedTags = new(StringComparer.Ordinal)
    {
        "defs", "metadata", "title", "desc", "style", "script", "clipPath", "mask",
        "filter", "linearGradient", "radialGradient", "pattern", "marker", "symbol",
    };

    private static readonly HashSet<string> ShapeTags = new(StringComparer.Ordinal)
    {
        "rect", "circle", "ellipse", "line", "polyline", "polygon",
    };

    private readonly record struct LengthValue(double Value, string Unit);

    private static double PxToMm(double pxPerInch) => MmPerInch / pxPerInch;

    private static LengthValue? ParseLength(string? s)
    {
        if (s is null) return null;
        var m = LengthRegex.Match(s.Trim());
        if (!m.Success) return null;
        if (!double.TryParse(m.Groups[1].Value, NumberStyles.Float, CultureInfo.InvariantCulture, out var value))
            return null;
        if (!double.IsFinite(value)) return null;
        return new LengthValue(value, m.Groups[2].Value.ToLowerInvariant());
    }

    private static double? LengthToMm(LengthValue? l, double pxPerInch, double percentRef = 0)
    {
        if (l is not { } length) return null;
        var p = PxToMm(pxPerInch);
        return length.Unit switch
        {
            "" or "px" => length.Value * p,
            "mm" => length.Value,
            "cm" => length.Value * 10,
            "in" => length.Value * MmPerInch,
            "pt" => length.Value * MmPerInch / 72,
            "pc" => length.Value * MmPerInch / 6,
            "%" => length.Value / 100 * percentRef,
            _ => length.Value * p,
        };
    }

    /// <summary>Numeric value in SVG user units.</summary>
    private static double? UserValue(string? s) => ParseLength(s)?.Value;

    /* -------------------------------------------------------------- */
    /* Transforms                                                      */
    /* -------------------------------------------------------------- */

    public static Matrix ParseTransformList(string? input)
    {
        if (string.IsNullOrEmpty(input)) return Matrix.Identity;
        var result = Matrix.Identity;
        foreach (Match m in TransformRegex.Matches(input))
        {
            var name = m.Groups[1].Value;
            var nums = NumberRegex.Matches(m.Groups[2].Value)
                .Select(x => double.Parse(x.Value, NumberStyles.Float, CultureInfo.InvariantCulture))
                .ToList();

            // JS `nums[0] || 0` (0 for missing/NaN/zero) vs `nums[0] ?? 1`.
            double OrZero(int i) => i < nums.Count && !double.IsNaN(nums[i]) ? nums[i] : 0;
            double OrDefault(int i, double fallback) => i < nums.Count ? nums[i] : fallback;

            Matrix? t = null;
            switch (name)
            {
                case "matrix":
                    if (nums.Count >= 6)
                    {
                        t = new Matrix(nums[0], nums[1], nums[2], nums[3], nums[4], nums[5]);
                    }
                    break;
                case "translate":
                    t = new Matrix(1, 0, 0, 1, OrZero(0), OrZero(1));
                    break;
                case "scale":
                {
                    var sx = OrDefault(0, 1);
                    var sy = OrDefault(1, sx);
                    t = new Matrix(sx, 0, 0, sy, 0, 0);
                    break;
                }
                case "rotate":
                {
                    var ang = OrZero(0) * Math.PI / 180;
                    var cx = OrZero(1);
                    var cy = OrZero(2);
                    var c = Math.Cos(ang);
                    var s = Math.Sin(ang);
                    var rot = new Matrix(c, s, -s, c, 0, 0);
                    var toOrigin = new Matrix(1, 0, 0, 1, -cx, -cy);
                    var back = new Matrix(1, 0, 0, 1, cx, cy);
                    t = Geom.MatrixMultiply(Geom.MatrixMultiply(back, rot), toOrigin);
                    break;
                }
                case "skewX":
                    t = new Matrix(1, 0, Math.Tan(OrZero(0) * Math.PI / 180), 1, 0, 0);
                    break;
                case "skewY":
                    t = new Matrix(1, Math.Tan(OrZero(0) * Math.PI / 180), 0, 1, 0, 0);
                    break;
            }

            if (t is { } transform) result = Geom.MatrixMultiply(result, transform);
        }
        return result;
    }

    /* -------------------------------------------------------------- */
    /* Element conversion                                              */
    /* -------------------------------------------------------------- */

    private static Path? ShapeToPath(XElement el)
    {
        var tag = XmlUtil.LocalName(el);
        double Num(string name, double fallback = 0)
        {
            var v = UserValue(XmlUtil.Attr(el, name));
            return v ?? fallback;
        }

        switch (tag)
        {
            case "path":
                // Multiple subpaths become multiple Paths; handled by the caller.
                return null;

            case "rect":
            {
                var x = Num("x");
                var y = Num("y");
                var w = Num("width");
                var h = Num("height");
                if (w <= 0 || h <= 0) return null;
                var rx = Num("rx", double.NaN);
                var ry = Num("ry", double.NaN);
                if (double.IsNaN(rx) && double.IsNaN(ry)) return Shapes.RectPath(x, y, w, h);
                if (double.IsNaN(rx)) rx = ry;
                if (double.IsNaN(ry)) ry = rx;
                if (rx <= 0 || ry <= 0) return Shapes.RectPath(x, y, w, h);
                var r = Math.Min(rx, ry);
                return Shapes.RoundedRectPath(x, y, w, h, r);
            }

            case "circle":
            {
                var cx = Num("cx");
                var cy = Num("cy");
                var r = Num("r");
                if (r <= 0) return null;
                return Shapes.EllipsePath(cx, cy, r, r);
            }

            case "ellipse":
            {
                var cx = Num("cx");
                var cy = Num("cy");
                var rx = Num("rx");
                var ry = Num("ry");
                if (rx <= 0 || ry <= 0) return null;
                return Shapes.EllipsePath(cx, cy, rx, ry);
            }

            case "line":
            {
                var x1 = Num("x1");
                var y1 = Num("y1");
                var x2 = Num("x2");
                var y2 = Num("y2");
                return new Path
                {
                    Closed = false,
                    Segments = { new LineSegment(new Vec(x1, y1), new Vec(x2, y2)) },
                };
            }

            case "polyline":
            case "polygon":
            {
                var raw = XmlUtil.Attr(el, "points");
                if (raw is null) return null;
                var nums = NumberRegex.Matches(raw)
                    .Select(x => double.Parse(x.Value, NumberStyles.Float, CultureInfo.InvariantCulture))
                    .ToList();
                if (nums.Count < 4) return null;
                var segments = new List<Segment>();
                var prev = new Vec(nums[0], nums[1]);
                var first = prev;
                for (var i = 2; i + 1 < nums.Count; i += 2)
                {
                    var p = new Vec(nums[i], nums[i + 1]);
                    segments.Add(new LineSegment(prev, p));
                    prev = p;
                }
                var closed = tag == "polygon";
                if (closed) segments.Add(new LineSegment(prev, first));
                return new Path { Closed = closed, Segments = segments };
            }

            default:
                return null;
        }
    }

    /* -------------------------------------------------------------- */
    /* Main parser                                                     */
    /* -------------------------------------------------------------- */

    public static SvgImportResult ParseSvg(string text, SvgImportOptions? options = null)
    {
        var pxPerInch = options?.PxPerInch ?? 96;
        var warnings = new List<string>();

        XDocument doc;
        try
        {
            doc = XDocument.Parse(text, LoadOptions.None);
        }
        catch (XmlException ex)
        {
            throw new InvalidOperationException("The file is not valid SVG: " + ex.Message, ex);
        }

        var root = doc.Root;
        if (root is null || XmlUtil.LocalName(root) != "svg")
        {
            throw new InvalidOperationException("The file does not contain an <svg> root element.");
        }

        var viewBoxAttr = XmlUtil.Attr(root, "viewBox");
        var viewBox = viewBoxAttr is null
            ? null
            : viewBoxAttr.Trim()
                .Split(new[] { ' ', '\t', '\r', '\n', ',' }, StringSplitOptions.RemoveEmptyEntries)
                .Select(s => double.TryParse(s, NumberStyles.Float, CultureInfo.InvariantCulture, out var n)
                    ? n
                    : double.NaN)
                .ToList();
        var hasViewBox = viewBox is { Count: 4 } && viewBox.All(double.IsFinite);

        var widthLen = ParseLength(XmlUtil.Attr(root, "width"));
        var heightLen = ParseLength(XmlUtil.Attr(root, "height"));
        var vbX = hasViewBox ? viewBox![0] : 0;
        var vbY = hasViewBox ? viewBox![1] : 0;
        var vbW = hasViewBox ? viewBox![2] : 0;
        var vbH = hasViewBox ? viewBox![3] : 0;

        var widthMm = LengthToMm(widthLen, pxPerInch) ?? 0;
        var heightMm = LengthToMm(heightLen, pxPerInch) ?? 0;

        if (hasViewBox && vbW > 0 && vbH > 0)
        {
            if (widthMm <= 0 && heightMm > 0) widthMm = heightMm * vbW / vbH;
            if (heightMm <= 0 && widthMm > 0) heightMm = widthMm * vbH / vbW;
            if (widthMm <= 0 && heightMm <= 0)
            {
                widthMm = vbW * PxToMm(pxPerInch);
                heightMm = vbH * PxToMm(pxPerInch);
            }
        }
        else
        {
            if (widthMm <= 0) widthMm = 100 * PxToMm(pxPerInch);
            if (heightMm <= 0) heightMm = 100 * PxToMm(pxPerInch);
        }

        // Root matrix: user units -> mm, Y flipped so the SVG's bottom-left is (0,0).
        Matrix rootMatrix;
        if (hasViewBox && vbW > 0 && vbH > 0)
        {
            var scaleX = widthMm / vbW;
            var scaleY = heightMm / vbH;
            var preserve = (XmlUtil.Attr(root, "preserveAspectRatio") ?? "xMidYMid meet").Trim();
            var useUniform = !preserve.StartsWith("none", StringComparison.Ordinal);
            var s = useUniform ? Math.Min(scaleX, scaleY) : 1;
            var sx = useUniform ? s : scaleX;
            var sy = useUniform ? s : scaleY;
            var drawnW = vbW * sx;
            var drawnH = vbH * sy;
            var offsetX = 0.0;
            var offsetY = 0.0;
            if (useUniform)
            {
                var align = preserve.StartsWith("xMax", StringComparison.Ordinal)
                    ? "max"
                    : preserve.StartsWith("xMin", StringComparison.Ordinal) ? "min" : "mid";
                var alignY = preserve.Contains("YMax", StringComparison.Ordinal)
                    ? "max"
                    : preserve.Contains("YMin", StringComparison.Ordinal) ? "min" : "mid";
                if (align == "mid") offsetX = (widthMm - drawnW) / 2;
                else if (align == "max") offsetX = widthMm - drawnW;
                if (alignY == "mid") offsetY = (heightMm - drawnH) / 2;
                else if (alignY == "max") offsetY = heightMm - drawnH;
            }
            // x' = (x - vbX)*sx + offsetX
            // y' = heightMm - ((y - vbY)*sy + offsetY)  (flip)
            rootMatrix = new Matrix(
                sx,
                0,
                0,
                -sy,
                offsetX - vbX * sx,
                heightMm - offsetY + vbY * sy);
        }
        else
        {
            var s = PxToMm(pxPerInch);
            rootMatrix = new Matrix(s, 0, 0, -s, 0, heightMm);
        }

        // Build an id map for <use> support.
        var idMap = new Dictionary<string, XElement>(StringComparer.Ordinal);
        foreach (var el in root.Descendants())
        {
            var id = XmlUtil.Attr(el, "id");
            if (!string.IsNullOrEmpty(id)) idMap[id] = el;
        }

        var paths = new List<Path>();
        var pathCounter = 0;

        void AddPath(Path p, Matrix m, string? sourceId)
        {
            var transformed = Geom.TransformPath(p, m);
            if (transformed.Segments.Count == 0) return;
            pathCounter++;
            transformed.Id = $"p{pathCounter}";
            transformed.Name = !string.IsNullOrEmpty(sourceId)
                ? sourceId
                : !string.IsNullOrEmpty(transformed.Name)
                    ? transformed.Name
                    : $"path {pathCounter}";
            transformed.SourceId = sourceId;
            paths.Add(transformed);
        }

        void Walk(XElement el, Matrix parentMatrix, int depth, HashSet<XElement> seenUse)
        {
            if (depth > 80)
            {
                warnings.Add("SVG nesting is too deep; some elements were skipped.");
                return;
            }

            var tag = XmlUtil.LocalName(el);
            if (SkippedTags.Contains(tag)) return;

            var styleAttr = XmlUtil.Attr(el, "style") ?? string.Empty;
            if (XmlUtil.Attr(el, "display") == "none" ||
                DisplayNoneRegex.IsMatch(styleAttr) ||
                VisibilityHiddenRegex.IsMatch(styleAttr))
            {
                return;
            }

            var local = ParseTransformList(XmlUtil.Attr(el, "transform"));
            var styleTransform = StyleTransformRegex.Match(styleAttr);
            if (styleTransform.Success)
            {
                local = Geom.MatrixMultiply(local, ParseTransformList(styleTransform.Groups[1].Value));
            }
            var matrix = Geom.MatrixMultiply(parentMatrix, local);

            if (tag == "svg" && el != root)
            {
                var x = UserValue(XmlUtil.Attr(el, "x")) ?? 0;
                var y = UserValue(XmlUtil.Attr(el, "y")) ?? 0;
                matrix = Geom.MatrixMultiply(matrix, new Matrix(1, 0, 0, 1, x, y));
            }

            if (tag == "use")
            {
                var href = XmlUtil.Attr(el, "href");
                var id = href is not null && href.StartsWith('#') ? href[1..] : null;
                var target = id is not null && idMap.TryGetValue(id, out var found) ? found : null;
                if (target is null)
                {
                    warnings.Add("A <use> element references a missing shape.");
                    return;
                }
                if (seenUse.Contains(target))
                {
                    warnings.Add("A recursive <use> reference was skipped.");
                    return;
                }
                var x = UserValue(XmlUtil.Attr(el, "x")) ?? 0;
                var y = UserValue(XmlUtil.Attr(el, "y")) ?? 0;
                var useMatrix = Geom.MatrixMultiply(matrix, new Matrix(1, 0, 0, 1, x, y));
                var nextSeen = new HashSet<XElement>(seenUse) { target };
                Walk(target, useMatrix, depth + 1, nextSeen);
                return;
            }

            if (tag is "g" or "svg" or "a" or "switch")
            {
                foreach (var child in el.Elements()) Walk(child, matrix, depth + 1, seenUse);
                return;
            }

            if (tag == "path")
            {
                var d = XmlUtil.Attr(el, "d");
                if (d is null) return;
                List<SubPathData> subs;
                try
                {
                    subs = SvgPathData.Parse(d);
                }
                catch (Exception ex)
                {
                    warnings.Add($"Could not parse a path: {ex.Message}");
                    return;
                }
                var id = XmlUtil.Attr(el, "id");
                foreach (var sub in subs)
                {
                    if (sub.Segments.Count == 0) continue;
                    AddPath(
                        new Path { Segments = sub.Segments, Closed = sub.Closed, SourceId = id },
                        matrix,
                        string.IsNullOrEmpty(id) ? null : id);
                }
                return;
            }

            if (ShapeTags.Contains(tag))
            {
                var p = ShapeToPath(el);
                if (p is not null) AddPath(p, matrix, XmlUtil.Attr(el, "id"));
                return;
            }

            if (tag is "text" or "tspan")
            {
                warnings.Add("Text elements are not converted (convert text to paths in your SVG editor).");
                return;
            }
            if (tag == "image")
            {
                warnings.Add("Raster images inside the SVG are ignored.");
                return;
            }
            // Unknown elements: recurse into children where possible.
            foreach (var child in el.Elements()) Walk(child, matrix, depth + 1, seenUse);
        }

        Walk(root, rootMatrix, 0, new HashSet<XElement>());

        if (paths.Count == 0)
        {
            warnings.Add("No supported geometry was found in the SVG.");
        }

        return new SvgImportResult
        {
            Paths = paths,
            Warnings = warnings,
            WidthMm = widthMm,
            HeightMm = heightMm,
            SourceWidth = vbW != 0 ? vbW : widthMm,
            SourceHeight = vbH != 0 ? vbH : heightMm,
            HasViewBox = hasViewBox,
        };
    }

    /* -------------------------------------------------------------- */
    /* Export helpers                                                  */
    /* -------------------------------------------------------------- */

    /// <summary>Serialises one path to an SVG <c>d</c> string using the supplied point mapper.</summary>
    public static string PathToSvgD(Path path, Func<Vec, Vec> map)
    {
        if (path.Segments.Count == 0) return string.Empty;

        string M(Vec p)
        {
            var q = map(p);
            return $"{Round(q.X)} {Round(q.Y)}";
        }

        var parts = new List<string> { $"M{M(path.Segments[0].P1)}" };
        foreach (var seg in path.Segments)
        {
            switch (seg)
            {
                case LineSegment l:
                    parts.Add($"L{M(l.P2)}");
                    break;
                case QuadSegment q:
                    parts.Add($"Q{M(q.C)} {M(q.P2)}");
                    break;
                case CubicSegment c:
                    parts.Add($"C{M(c.C1)} {M(c.C2)} {M(c.P2)}");
                    break;
            }
        }
        if (path.Closed) parts.Add("Z");
        return string.Join(" ", parts);
    }

    private static string Round(double n) => JsMath.FormatShort(JsMath.Round(n * 10000) / 10000);
}
