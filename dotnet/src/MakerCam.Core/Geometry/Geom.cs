namespace MakerCam.Core;

/// <summary>
/// Geometry primitives: vectors, affine transforms, curve flattening, polygon
/// helpers and path normalisation. This is a direct port of the TypeScript
/// <c>geom.ts</c> module, preserving operation order so results match exactly.
/// </summary>
public static class Geom
{
    public const double EPS = 1e-9;

    /* -------------------------------------------------------------- */
    /* Vectors                                                         */
    /* -------------------------------------------------------------- */

    public static Vec Pt(double x, double y) => new(x, y);

    public static Vec CloneVec(Vec p) => p;

    public static Vec Add(Vec a, Vec b) => new(a.X + b.X, a.Y + b.Y);

    public static Vec Sub(Vec a, Vec b) => new(a.X - b.X, a.Y - b.Y);

    public static Vec Mul(Vec a, double s) => new(a.X * s, a.Y * s);

    public static double Dot(Vec a, Vec b) => a.X * b.X + a.Y * b.Y;

    public static double Cross(Vec a, Vec b) => a.X * b.Y - a.Y * b.X;

    public static double Hypot(double x, double y) => Math.Sqrt(x * x + y * y);

    public static double Length(Vec a) => Hypot(a.X, a.Y);

    public static double Dist(Vec a, Vec b) => Hypot(a.X - b.X, a.Y - b.Y);

    public static double Dist2(Vec a, Vec b)
    {
        var dx = a.X - b.X;
        var dy = a.Y - b.Y;
        return dx * dx + dy * dy;
    }

    public static Vec Lerp(Vec a, Vec b, double t) =>
        new(a.X + (b.X - a.X) * t, a.Y + (b.Y - a.Y) * t);

    public static Vec Normalize(Vec a)
    {
        var l = Length(a);
        return l < EPS ? Vec.Zero : new Vec(a.X / l, a.Y / l);
    }

    public static bool Equals(Vec a, Vec b, double tol = 1e-7) =>
        Math.Abs(a.X - b.X) <= tol && Math.Abs(a.Y - b.Y) <= tol;

    /// <summary>Signed angle from a to b, in (-pi, pi].</summary>
    public static double AngleBetween(Vec a, Vec b) => Math.Atan2(Cross(a, b), Dot(a, b));

    /* -------------------------------------------------------------- */
    /* Segments and paths                                              */
    /* -------------------------------------------------------------- */

    public static Vec SegmentStart(Segment s) => s.P1;

    public static Vec SegmentEnd(Segment s) => s.P2;

    public static Segment CloneSegment(Segment s) => s switch
    {
        LineSegment l => new LineSegment(l.P1, l.P2),
        QuadSegment q => new QuadSegment(q.P1, q.C, q.P2),
        CubicSegment c => new CubicSegment(c.P1, c.C1, c.C2, c.P2),
        _ => throw new ArgumentOutOfRangeException(nameof(s)),
    };

    public static Segment ReverseSegment(Segment s) => s switch
    {
        LineSegment l => new LineSegment(l.P2, l.P1),
        QuadSegment q => new QuadSegment(q.P2, q.C, q.P1),
        CubicSegment c => new CubicSegment(c.P2, c.C2, c.C1, c.P1),
        _ => throw new ArgumentOutOfRangeException(nameof(s)),
    };

    public static Path ReversePath(Path path) => new()
    {
        Segments = path.Segments.AsEnumerable().Reverse().Select(ReverseSegment).ToList(),
        Closed = path.Closed,
        Name = path.Name,
        Id = path.Id,
        SourceId = path.SourceId,
    };

    public static Path ClonePath(Path path) => path.Clone();

    /* -------------------------------------------------------------- */
    /* Matrices                                                        */
    /* -------------------------------------------------------------- */

    public static Vec MatrixApply(Matrix m, Vec p) => new(
        m.A * p.X + m.C * p.Y + m.E,
        m.B * p.X + m.D * p.Y + m.F);

    public static Vec MatrixApplyVector(Matrix m, Vec p) =>
        new(m.A * p.X + m.C * p.Y, m.B * p.X + m.D * p.Y);

    /// <summary>Returns m1 ∘ m2 (m2 applied first).</summary>
    public static Matrix MatrixMultiply(Matrix m1, Matrix m2) => new(
        m1.A * m2.A + m1.C * m2.B,
        m1.B * m2.A + m1.D * m2.B,
        m1.A * m2.C + m1.C * m2.D,
        m1.B * m2.C + m1.D * m2.D,
        m1.A * m2.E + m1.C * m2.F + m1.E,
        m1.B * m2.E + m1.D * m2.F + m1.F);

    public static Matrix MatrixTranslate(double x, double y) => new(1, 0, 0, 1, x, y);

    public static Matrix MatrixScale(double sx, double? sy = null) =>
        new(sx, 0, 0, sy ?? sx, 0, 0);

    public static Matrix MatrixRotate(double radians)
    {
        var c = Math.Cos(radians);
        var s = Math.Sin(radians);
        return new Matrix(c, s, -s, c, 0, 0);
    }

    public static Matrix MatrixSkew(double axRadians, double ayRadians) =>
        new(1, Math.Tan(ayRadians), Math.Tan(axRadians), 1, 0, 0);

    public static Matrix MatrixInvert(Matrix m)
    {
        var det = m.A * m.D - m.B * m.C;
        if (Math.Abs(det) < EPS) return Matrix.Identity;
        var inv = 1 / det;
        return new Matrix(
            m.D * inv,
            -m.B * inv,
            -m.C * inv,
            m.A * inv,
            (m.C * m.F - m.D * m.E) * inv,
            (m.B * m.E - m.A * m.F) * inv);
    }

    public static Path TransformPath(Path path, Matrix m)
    {
        Vec Tp(Vec p) => MatrixApply(m, p);
        var segments = path.Segments.Select(s => s switch
        {
            LineSegment l => (Segment)new LineSegment(Tp(l.P1), Tp(l.P2)),
            QuadSegment q => new QuadSegment(Tp(q.P1), Tp(q.C), Tp(q.P2)),
            CubicSegment c => new CubicSegment(Tp(c.P1), Tp(c.C1), Tp(c.C2), Tp(c.P2)),
            _ => throw new ArgumentOutOfRangeException(nameof(path)),
        }).ToList();

        return new Path
        {
            Segments = segments,
            Closed = path.Closed,
            Name = path.Name,
            Id = path.Id,
            SourceId = path.SourceId,
        };
    }

    /* -------------------------------------------------------------- */
    /* Flattening                                                      */
    /* -------------------------------------------------------------- */

    private static double DistancePointToLine(Vec p, Vec a, Vec b)
    {
        var abx = b.X - a.X;
        var aby = b.Y - a.Y;
        var l2 = abx * abx + aby * aby;
        if (l2 < EPS) return Dist(p, a);
        var t = ((p.X - a.X) * abx + (p.Y - a.Y) * aby) / l2;
        t = Math.Max(0, Math.Min(1, t));
        return Hypot(p.X - (a.X + abx * t), p.Y - (a.Y + aby * t));
    }

    /// <summary>Appends points along a segment to <paramref name="output"/>, excluding the segment start.</summary>
    public static void FlattenSegment(Segment seg, double tolerance, List<Vec> output, int depth = 0)
    {
        var tol = Math.Max(tolerance, 1e-6);
        switch (seg)
        {
            case LineSegment line:
                output.Add(line.P2);
                return;

            case QuadSegment quad:
            {
                var flat = Math.Max(DistancePointToLine(quad.C, quad.P1, quad.P2), 0);
                if (flat <= tol || depth >= 20)
                {
                    output.Add(quad.P2);
                    return;
                }

                var m01 = Lerp(quad.P1, quad.C, 0.5);
                var m12 = Lerp(quad.C, quad.P2, 0.5);
                var mid = Lerp(m01, m12, 0.5);
                FlattenSegment(new QuadSegment(quad.P1, m01, mid), tol, output, depth + 1);
                FlattenSegment(new QuadSegment(mid, m12, quad.P2), tol, output, depth + 1);
                return;
            }

            case CubicSegment cubic:
            {
                var flat = Math.Max(
                    DistancePointToLine(cubic.C1, cubic.P1, cubic.P2),
                    DistancePointToLine(cubic.C2, cubic.P1, cubic.P2));
                if (flat <= tol || depth >= 20)
                {
                    output.Add(cubic.P2);
                    return;
                }

                // de Casteljau split at t = 0.5
                var p01 = Lerp(cubic.P1, cubic.C1, 0.5);
                var p12 = Lerp(cubic.C1, cubic.C2, 0.5);
                var p23 = Lerp(cubic.C2, cubic.P2, 0.5);
                var p012 = Lerp(p01, p12, 0.5);
                var p123 = Lerp(p12, p23, 0.5);
                var mid = Lerp(p012, p123, 0.5);
                FlattenSegment(new CubicSegment(cubic.P1, p01, p012, mid), tol, output, depth + 1);
                FlattenSegment(new CubicSegment(mid, p123, p23, cubic.P2), tol, output, depth + 1);
                return;
            }

            default:
                throw new ArgumentOutOfRangeException(nameof(seg));
        }
    }

    /// <summary>
    /// Flattens a path to a polyline. The returned list starts at the first
    /// segment's start point and includes every segment end point.
    /// </summary>
    public static List<Vec> FlattenPath(Path path, double tolerance = 0.02)
    {
        var output = new List<Vec>();
        if (path.Segments.Count == 0) return output;
        output.Add(path.Segments[0].P1);
        foreach (var seg in path.Segments) FlattenSegment(seg, tolerance, output);
        return output;
    }

    /// <summary>Closed polygon points (no duplicated closing point).</summary>
    public static List<Vec> ClosedPolygon(Path path, double tolerance = 0.02)
    {
        var pts = FlattenPath(path, tolerance);
        if (pts.Count > 1 && Equals(pts[0], pts[^1], 1e-6)) pts.RemoveAt(pts.Count - 1);
        return pts;
    }

    public static bool IsClosedPath(Path path, double tol = 1e-5)
    {
        if (path.Closed) return true;
        if (path.Segments.Count == 0) return false;
        return Equals(path.Segments[0].P1, path.Segments[^1].P2, tol);
    }

    /* -------------------------------------------------------------- */
    /* Polygon helpers                                                 */
    /* -------------------------------------------------------------- */

    /// <summary>Signed area: positive for counter-clockwise in a Y-up system.</summary>
    public static double PolygonArea(IReadOnlyList<Vec> points)
    {
        var a = 0.0;
        for (int i = 0, j = points.Count - 1; i < points.Count; j = i++)
        {
            a += points[j].X * points[i].Y - points[i].X * points[j].Y;
        }
        return a * 0.5;
    }

    public static double PolygonPerimeter(IReadOnlyList<Vec> points)
    {
        var l = 0.0;
        for (var i = 0; i < points.Count; i++)
        {
            l += Dist(points[i], points[(i + 1) % points.Count]);
        }
        return l;
    }

    public static bool PointInPolygon(IReadOnlyList<Vec> points, Vec p, bool includeBoundary = true)
    {
        var inside = false;
        for (int i = 0, j = points.Count - 1; i < points.Count; j = i++)
        {
            var a = points[i];
            var b = points[j];
            if (includeBoundary && DistancePointToSegment(p, a, b) < 1e-7) return true;
            var intersects =
                a.Y > p.Y != b.Y > p.Y &&
                p.X < (b.X - a.X) * (p.Y - a.Y) / (b.Y - a.Y + (b.Y == a.Y ? 1e-30 : 0)) + a.X;
            if (intersects) inside = !inside;
        }
        return inside;
    }

    public static double DistancePointToSegment(Vec p, Vec a, Vec b) => DistancePointToLine(p, a, b);

    public static double DistanceToPolyline(Vec p, IReadOnlyList<Vec> points, bool closed = false)
    {
        var best = double.PositiveInfinity;
        var n = points.Count;
        var count = closed ? n : n - 1;
        for (var i = 0; i < count; i++)
        {
            best = Math.Min(best, DistancePointToSegment(p, points[i], points[(i + 1) % n]));
        }
        if (n == 1) best = Dist(p, points[0]);
        return best;
    }

    public static Bounds PolygonBounds(IReadOnlyList<Vec> points)
    {
        if (points.Count == 0) return Bounds.Empty;
        var minX = points[0].X;
        var maxX = points[0].X;
        var minY = points[0].Y;
        var maxY = points[0].Y;
        foreach (var p in points)
        {
            if (p.X < minX) minX = p.X;
            if (p.X > maxX) maxX = p.X;
            if (p.Y < minY) minY = p.Y;
            if (p.Y > maxY) maxY = p.Y;
        }
        return new Bounds(minX, minY, maxX, maxY);
    }

    public static Bounds PathBounds(Path path, double tolerance = 0.02) =>
        PolygonBounds(FlattenPath(path, tolerance));

    public static Bounds UnionBounds(Bounds? a, Bounds b)
    {
        if (a is null) return b;
        var x = a.Value;
        return new Bounds(
            Math.Min(x.MinX, b.MinX),
            Math.Min(x.MinY, b.MinY),
            Math.Max(x.MaxX, b.MaxX),
            Math.Max(x.MaxY, b.MaxY));
    }

    public static Bounds? PointsBounds(IEnumerable<IReadOnlyList<Vec>> list)
    {
        Bounds? b = null;
        foreach (var pts in list) b = UnionBounds(b, PolygonBounds(pts));
        return b;
    }

    public static List<Vec> RotatePoints(IReadOnlyList<Vec> points, double angleRad, Vec around = default)
    {
        var c = Math.Cos(angleRad);
        var s = Math.Sin(angleRad);
        var result = new List<Vec>(points.Count);
        foreach (var p in points)
        {
            var x = p.X - around.X;
            var y = p.Y - around.Y;
            result.Add(new Vec(around.X + c * x - s * y, around.Y + s * x + c * y));
        }
        return result;
    }

    public static List<Vec> EnsureOrientation(IReadOnlyList<Vec> points, bool ccw)
    {
        var isCcw = PolygonArea(points) > 0;
        if (isCcw == ccw) return points.ToList();
        var reversed = points.ToList();
        reversed.Reverse();
        return reversed;
    }

    public static List<Vec> RotatePointsToStart(IReadOnlyList<Vec> points, int index)
    {
        if (points.Count == 0) return points.ToList();
        var i = ((index % points.Count) + points.Count) % points.Count;
        var result = new List<Vec>(points.Count);
        for (var k = 0; k < points.Count; k++) result.Add(points[(i + k) % points.Count]);
        return result;
    }

    public static int NearestPointIndex(IReadOnlyList<Vec> points, Vec target)
    {
        var best = 0;
        var bestD = double.PositiveInfinity;
        for (var i = 0; i < points.Count; i++)
        {
            var d = Dist2(points[i], target);
            if (d < bestD)
            {
                bestD = d;
                best = i;
            }
        }
        return best;
    }

    /// <summary>Removes consecutive duplicate points.</summary>
    public static List<Vec> DedupePoints(IReadOnlyList<Vec> points, double tol = 1e-6)
    {
        var output = new List<Vec>();
        foreach (var p in points)
        {
            if (output.Count == 0 || !Equals(output[^1], p, tol)) output.Add(p);
        }
        if (output.Count > 1 && Equals(output[0], output[^1], tol)) output.RemoveAt(output.Count - 1);
        return output;
    }

    /* -------------------------------------------------------------- */
    /* Lengths and sampling                                            */
    /* -------------------------------------------------------------- */

    public static double SegmentLength(Segment seg, double tolerance = 0.02)
    {
        var pts = new List<Vec> { seg.P1 };
        FlattenSegment(seg, tolerance, pts);
        var l = 0.0;
        for (var i = 1; i < pts.Count; i++) l += Dist(pts[i - 1], pts[i]);
        return l;
    }

    public static double PathLength(Path path, double tolerance = 0.02) =>
        path.Segments.Sum(s => SegmentLength(s, tolerance));

    /* -------------------------------------------------------------- */
    /* Path normalisation                                              */
    /* -------------------------------------------------------------- */

    /// <summary>Splits a path at gaps between consecutive segments.</summary>
    public static List<Path> SplitDiscontinuous(Path path)
    {
        var output = new List<Path>();
        var currentSegs = new List<Segment>();
        foreach (var seg in path.Segments)
        {
            if (currentSegs.Count > 0 && !Equals(currentSegs[^1].P2, seg.P1, 1e-5))
            {
                output.Add(new Path { Segments = currentSegs, Closed = false });
                currentSegs = new List<Segment>();
            }
            currentSegs.Add(seg);
        }
        if (currentSegs.Count > 0)
        {
            output.Add(new Path { Segments = currentSegs, Closed = path.Closed });
        }
        return output;
    }

    /// <summary>Removes zero-length segments and joins segment endpoints that are close.</summary>
    public static Path CleanPath(Path path, double tol = 1e-4)
    {
        var segs = new List<Segment>();
        foreach (var original in path.Segments)
        {
            var seg = original;
            if (Dist(seg.P1, seg.P2) <= tol)
            {
                if (seg.Kind == SegmentKind.Line) continue;
            }
            if (segs.Count > 0)
            {
                var prev = segs[^1];
                if (Equals(prev.P2, seg.P1, tol))
                {
                    seg = seg.WithP1(prev.P2);
                }
                // Otherwise leave the gap; the caller can split the path.
            }
            segs.Add(seg);
        }

        var result = new Path
        {
            Segments = segs,
            Closed = path.Closed,
            Name = path.Name,
            Id = path.Id,
            SourceId = path.SourceId,
        };
        result.Closed = IsClosedPath(result, tol);
        return result;
    }

    /// <summary>Computes a path's average point using flattened geometry.</summary>
    public static Vec PathCentroid(Path path, double tolerance = 0.02)
    {
        var pts = FlattenPath(path, tolerance);
        if (pts.Count == 0) return Vec.Zero;
        double x = 0, y = 0;
        foreach (var p in pts)
        {
            x += p.X;
            y += p.Y;
        }
        return new Vec(x / pts.Count, y / pts.Count);
    }

    public static Vec SegmentMidpoint(Segment seg) => seg switch
    {
        LineSegment l => Lerp(l.P1, l.P2, 0.5),
        QuadSegment q => new Vec(
            0.25 * q.P1.X + 0.5 * q.C.X + 0.25 * q.P2.X,
            0.25 * q.P1.Y + 0.5 * q.C.Y + 0.25 * q.P2.Y),
        CubicSegment c => CubicAt(c, 0.5),
        _ => throw new ArgumentOutOfRangeException(nameof(seg)),
    };

    private static Vec CubicAt(CubicSegment c, double t)
    {
        var mt = 1 - t;
        var a = mt * mt * mt;
        var b = 3 * mt * mt * t;
        var cw = 3 * mt * t * t;
        var d = t * t * t;
        return new Vec(
            a * c.P1.X + b * c.C1.X + cw * c.C2.X + d * c.P2.X,
            a * c.P1.Y + b * c.C1.Y + cw * c.C2.Y + d * c.P2.Y);
    }

    public static Vec? SnapPointToSegments(Vec point, IEnumerable<Path> paths, double tolerance)
    {
        Vec? best = null;
        var bestD = tolerance;
        foreach (var path in paths)
        {
            foreach (var seg in path.Segments)
            {
                var pts = FlattenPath(
                    new Path { Segments = new List<Segment> { seg }, Closed = false },
                    Math.Min(0.05, tolerance));
                for (var i = 0; i < pts.Count - 1; i++)
                {
                    var d = DistancePointToSegment(point, pts[i], pts[i + 1]);
                    if (d <= bestD)
                    {
                        bestD = d;
                        var a = pts[i];
                        var b = pts[i + 1];
                        var abx = b.X - a.X;
                        var aby = b.Y - a.Y;
                        var l2 = abx * abx + aby * aby;
                        var t = l2 > 0
                            ? Math.Max(0, Math.Min(1, ((point.X - a.X) * abx + (point.Y - a.Y) * aby) / l2))
                            : 0;
                        best = new Vec(a.X + abx * t, a.Y + aby * t);
                    }
                }
            }
        }
        return best;
    }
}
