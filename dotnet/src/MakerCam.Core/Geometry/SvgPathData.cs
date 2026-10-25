using System.Globalization;
using System.Text.RegularExpressions;

namespace MakerCam.Core;

/// <summary>
/// Parses SVG path data and converts elliptical arcs to cubic Béziers.
/// Supports M L H V C S Q T A Z (absolute and relative).
/// </summary>
public static class SvgPathData
{
    private const string NumberPattern = @"[+-]?(?:(?:\d+\.?\d*)|(?:\.\d+))(?:[eE][+-]?\d+)?";

    private static readonly Regex TokenRegex = new(
        @"[a-zA-Z]|" + NumberPattern,
        RegexOptions.Compiled | RegexOptions.CultureInvariant);

    /// <summary>Converts an SVG elliptical arc into cubic Bézier segments.</summary>
    public static List<CubicSegment> ArcToCubics(
        Vec p1,
        double rxIn,
        double ryIn,
        double xAxisRotationDeg,
        bool largeArc,
        bool sweep,
        Vec p2)
    {
        var rx = Math.Abs(rxIn);
        var ry = Math.Abs(ryIn);
        if (rx < Geom.EPS || ry < Geom.EPS || Geom.Equals(p1, p2))
        {
            if (Geom.Equals(p1, p2)) return new List<CubicSegment>();
            return new List<CubicSegment>
            {
                new(p1, Geom.Lerp(p1, p2, 1.0 / 3), Geom.Lerp(p1, p2, 2.0 / 3), p2),
            };
        }

        var phi = xAxisRotationDeg * Math.PI / 180;
        var cosPhi = Math.Cos(phi);
        var sinPhi = Math.Sin(phi);
        var dx = (p1.X - p2.X) / 2;
        var dy = (p1.Y - p2.Y) / 2;
        var x1p = cosPhi * dx + sinPhi * dy;
        var y1p = -sinPhi * dx + cosPhi * dy;

        var lambda = x1p * x1p / (rx * rx) + y1p * y1p / (ry * ry);
        if (lambda > 1)
        {
            var scale = Math.Sqrt(lambda);
            rx *= scale;
            ry *= scale;
        }

        var sign = largeArc == sweep ? -1 : 1;
        var num = rx * rx * ry * ry - rx * rx * y1p * y1p - ry * ry * x1p * x1p;
        var den = rx * rx * y1p * y1p + ry * ry * x1p * x1p;
        var coef = sign * Math.Sqrt(Math.Max(0, num / den));
        var cxp = coef * (rx * y1p) / ry;
        var cyp = coef * -(ry * x1p) / rx;
        var cx = cosPhi * cxp - sinPhi * cyp + (p1.X + p2.X) / 2;
        var cy = sinPhi * cxp + cosPhi * cyp + (p1.Y + p2.Y) / 2;

        double Angle(double ux, double uy, double vx, double vy)
        {
            var dotv = ux * vx + uy * vy;
            var lenv = Geom.Hypot(ux, uy) * Geom.Hypot(vx, vy);
            var a = Math.Acos(Math.Max(-1, Math.Min(1, dotv / (lenv == 0 ? 1 : lenv))));
            if (ux * vy - uy * vx < 0) a = -a;
            return a;
        }

        var theta1 = Angle(1, 0, (x1p - cxp) / rx, (y1p - cyp) / ry);
        var delta = Angle(
            (x1p - cxp) / rx,
            (y1p - cyp) / ry,
            (-x1p - cxp) / rx,
            (-y1p - cyp) / ry);
        if (!sweep && delta > 0) delta -= 2 * Math.PI;
        if (sweep && delta < 0) delta += 2 * Math.PI;

        var nseg = Math.Max(1, (int)Math.Ceiling(Math.Abs(delta) / (Math.PI / 2)));
        var deltaSeg = delta / nseg;
        var result = new List<CubicSegment>();
        var theta = theta1;

        Vec MapPoint(double th)
        {
            var cosT = Math.Cos(th);
            var sinT = Math.Sin(th);
            return new Vec(
                cx + cosPhi * rx * cosT - sinPhi * ry * sinT,
                cy + sinPhi * rx * cosT + cosPhi * ry * sinT);
        }

        Vec MapDeriv(double th)
        {
            var cosT = Math.Cos(th);
            var sinT = Math.Sin(th);
            return new Vec(
                -cosPhi * rx * sinT - sinPhi * ry * cosT,
                -sinPhi * rx * sinT + cosPhi * ry * cosT);
        }

        var start = p1;
        for (var i = 0; i < nseg; i++)
        {
            var theta2 = theta + deltaSeg;
            var end = MapPoint(theta2);
            var k = 4.0 / 3 * Math.Tan((theta2 - theta) / 4);
            var d1 = MapDeriv(theta);
            var d2 = MapDeriv(theta2);
            result.Add(new CubicSegment(
                start,
                new Vec(start.X + k * d1.X, start.Y + k * d1.Y),
                new Vec(end.X - k * d2.X, end.Y - k * d2.Y),
                end));
            start = end;
            theta = theta2;
        }

        // Snap the final endpoint to the requested one to avoid round-off drift.
        if (result.Count > 0) result[^1] = result[^1] with { P2 = p2 };
        return result;
    }

    /// <summary>Parses an SVG <c>d</c> attribute into one entry per subpath.</summary>
    public static List<SubPathData> Parse(string d)
    {
        var tokens = TokenRegex.Matches(d).Select(m => m.Value).ToList();
        if (tokens.Count == 0) return new List<SubPathData>();

        var result = new List<SubPathData>();
        SubPathData? current = null;
        var cur = Vec.Zero;
        var start = Vec.Zero;
        Vec? lastCubicC2 = null;
        Vec? lastQuadC = null;
        var command = string.Empty;
        var index = 0;

        void NewSubPath(Vec p)
        {
            if (current is { Segments.Count: > 0 }) result.Add(current);
            current = new SubPathData();
            cur = p;
            start = p;
        }

        SubPathData Ensure()
        {
            if (current is null) NewSubPath(cur);
            return current!;
        }

        static bool IsCommand(string t) => t.Length == 1 && char.IsLetter(t[0]);

        double TakeNumber()
        {
            var t = index < tokens.Count ? tokens[index++] : null;
            if (t is null || IsCommand(t))
            {
                throw new FormatException($"Expected number in path data near token {index}");
            }
            return double.Parse(t, NumberStyles.Float, CultureInfo.InvariantCulture);
        }

        while (index < tokens.Count)
        {
            if (IsCommand(tokens[index]))
            {
                command = tokens[index++];
            }
            else if (command.Length == 0)
            {
                index++;
                continue;
            }

            if (command.Length == 0) break;
            var rel = char.IsLower(command[0]);
            var cmd = char.ToUpperInvariant(command[0]);
            Vec Origin(Vec p) => rel ? new Vec(cur.X + p.X, cur.Y + p.Y) : p;
            Vec OriginXy(double x, double y) => Origin(new Vec(x, y));

            switch (cmd)
            {
                case 'M':
                {
                    var p = OriginXy(TakeNumber(), TakeNumber());
                    NewSubPath(p);
                    command = rel ? "l" : "L";
                    lastCubicC2 = lastQuadC = null;
                    break;
                }
                case 'L':
                {
                    var p = OriginXy(TakeNumber(), TakeNumber());
                    Ensure().Segments.Add(new LineSegment(cur, p));
                    cur = p;
                    lastCubicC2 = lastQuadC = null;
                    break;
                }
                case 'H':
                {
                    var x = TakeNumber();
                    var p = rel ? new Vec(cur.X + x, cur.Y) : new Vec(x, cur.Y);
                    Ensure().Segments.Add(new LineSegment(cur, p));
                    cur = p;
                    lastCubicC2 = lastQuadC = null;
                    break;
                }
                case 'V':
                {
                    var y = TakeNumber();
                    var p = rel ? new Vec(cur.X, cur.Y + y) : new Vec(cur.X, y);
                    Ensure().Segments.Add(new LineSegment(cur, p));
                    cur = p;
                    lastCubicC2 = lastQuadC = null;
                    break;
                }
                case 'C':
                {
                    var c1 = OriginXy(TakeNumber(), TakeNumber());
                    var c2 = OriginXy(TakeNumber(), TakeNumber());
                    var p = OriginXy(TakeNumber(), TakeNumber());
                    Ensure().Segments.Add(new CubicSegment(cur, c1, c2, p));
                    cur = p;
                    lastCubicC2 = c2;
                    lastQuadC = null;
                    break;
                }
                case 'S':
                {
                    var c2 = OriginXy(TakeNumber(), TakeNumber());
                    var p = OriginXy(TakeNumber(), TakeNumber());
                    var c1 = lastCubicC2 is { } lc
                        ? new Vec(2 * cur.X - lc.X, 2 * cur.Y - lc.Y)
                        : cur;
                    Ensure().Segments.Add(new CubicSegment(cur, c1, c2, p));
                    cur = p;
                    lastCubicC2 = c2;
                    lastQuadC = null;
                    break;
                }
                case 'Q':
                {
                    var c = OriginXy(TakeNumber(), TakeNumber());
                    var p = OriginXy(TakeNumber(), TakeNumber());
                    Ensure().Segments.Add(new QuadSegment(cur, c, p));
                    cur = p;
                    lastQuadC = c;
                    lastCubicC2 = null;
                    break;
                }
                case 'T':
                {
                    var p = OriginXy(TakeNumber(), TakeNumber());
                    var c = lastQuadC is { } lq
                        ? new Vec(2 * cur.X - lq.X, 2 * cur.Y - lq.Y)
                        : cur;
                    Ensure().Segments.Add(new QuadSegment(cur, c, p));
                    cur = p;
                    lastQuadC = c;
                    lastCubicC2 = null;
                    break;
                }
                case 'A':
                {
                    var rx = TakeNumber();
                    var ry = TakeNumber();
                    var rot = TakeNumber();
                    var large = TakeNumber() != 0;
                    var sweep = TakeNumber() != 0;
                    var p = OriginXy(TakeNumber(), TakeNumber());
                    Ensure().Segments.AddRange(ArcToCubics(cur, rx, ry, rot, large, sweep, p));
                    cur = p;
                    lastCubicC2 = lastQuadC = null;
                    break;
                }
                case 'Z':
                {
                    var sp = Ensure();
                    if (sp.Segments.Count > 0 && !Geom.Equals(cur, start, 1e-7))
                    {
                        sp.Segments.Add(new LineSegment(cur, start));
                    }
                    sp.Closed = true;
                    cur = start;
                    lastCubicC2 = lastQuadC = null;
                    // A number after Z is invalid; skip it rather than looping forever.
                    if (index < tokens.Count && !IsCommand(tokens[index])) index++;
                    break;
                }
                default:
                    index++;
                    break;
            }
        }

        if (current is { Segments.Count: > 0 }) result.Add(current);
        return result;
    }
}
