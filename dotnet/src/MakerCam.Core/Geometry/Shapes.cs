namespace MakerCam.Core;

/// <summary>Builders for the primitive shapes offered by the drawing tools.</summary>
public static class Shapes
{
    private const double Kappa = 0.5522847498307936;

    public static Path RectPath(double x, double y, double w, double h) => new()
    {
        Closed = true,
        Segments =
        {
            new LineSegment(new Vec(x, y), new Vec(x + w, y)),
            new LineSegment(new Vec(x + w, y), new Vec(x + w, y + h)),
            new LineSegment(new Vec(x + w, y + h), new Vec(x, y + h)),
            new LineSegment(new Vec(x, y + h), new Vec(x, y)),
        },
    };

    public static Path RoundedRectPath(double x, double y, double w, double h, double r)
    {
        var rr = Math.Max(0, Math.Min(r, Math.Min(w, h) / 2));
        if (rr < 1e-9) return RectPath(x, y, w, h);

        var k = Kappa * rr;
        var segs = new List<Segment>
        {
            new LineSegment(new Vec(x + rr, y), new Vec(x + w - rr, y)),
            new CubicSegment(
                new Vec(x + w - rr, y),
                new Vec(x + w - rr + k, y),
                new Vec(x + w, y + rr - k),
                new Vec(x + w, y + rr)),
            new LineSegment(new Vec(x + w, y + rr), new Vec(x + w, y + h - rr)),
            new CubicSegment(
                new Vec(x + w, y + h - rr),
                new Vec(x + w, y + h - rr + k),
                new Vec(x + w - rr + k, y + h),
                new Vec(x + w - rr, y + h)),
            new LineSegment(new Vec(x + w - rr, y + h), new Vec(x + rr, y + h)),
            new CubicSegment(
                new Vec(x + rr, y + h),
                new Vec(x + rr - k, y + h),
                new Vec(x, y + h - rr + k),
                new Vec(x, y + h - rr)),
            new LineSegment(new Vec(x, y + h - rr), new Vec(x, y + rr)),
            new CubicSegment(
                new Vec(x, y + rr),
                new Vec(x, y + rr - k),
                new Vec(x + rr - k, y),
                new Vec(x + rr, y)),
        };
        return new Path { Closed = true, Segments = segs };
    }

    public static Path EllipsePath(double cx, double cy, double rx, double ry)
    {
        var kx = Kappa * rx;
        var ky = Kappa * ry;
        return new Path
        {
            Closed = true,
            Segments =
            {
                new CubicSegment(
                    new Vec(cx + rx, cy),
                    new Vec(cx + rx, cy + ky),
                    new Vec(cx + kx, cy + ry),
                    new Vec(cx, cy + ry)),
                new CubicSegment(
                    new Vec(cx, cy + ry),
                    new Vec(cx - kx, cy + ry),
                    new Vec(cx - rx, cy + ky),
                    new Vec(cx - rx, cy)),
                new CubicSegment(
                    new Vec(cx - rx, cy),
                    new Vec(cx - rx, cy - ky),
                    new Vec(cx - kx, cy - ry),
                    new Vec(cx, cy - ry)),
                new CubicSegment(
                    new Vec(cx, cy - ry),
                    new Vec(cx + kx, cy - ry),
                    new Vec(cx + rx, cy - ky),
                    new Vec(cx + rx, cy)),
            },
        };
    }

    public static Path PolygonPath(
        double cx,
        double cy,
        double radius,
        int sides,
        double startAngle = Math.PI / 2)
    {
        var n = Math.Max(3, sides);
        var segs = new List<Segment>();
        var prev = new Vec(cx + radius * Math.Cos(startAngle), cy + radius * Math.Sin(startAngle));
        var first = prev;
        for (var i = 1; i < n; i++)
        {
            var a = startAngle + i * 2 * Math.PI / n;
            var p = new Vec(cx + radius * Math.Cos(a), cy + radius * Math.Sin(a));
            segs.Add(new LineSegment(prev, p));
            prev = p;
        }
        segs.Add(new LineSegment(prev, first));
        return new Path { Closed = true, Segments = segs };
    }

    public static Path StarPath(double cx, double cy, double radius, int points, double pointinessPct)
    {
        var n = Math.Max(3, points);
        var inner = radius * Math.Max(0, Math.Min(0.99, 1 - pointinessPct / 100));
        var segs = new List<Segment>();
        var angleStep = 2 * Math.PI / n;
        var start = -Math.PI / 2;
        var first = new Vec(cx + radius * Math.Cos(start), cy + radius * Math.Sin(start));
        var prev = first;
        for (var i = 1; i <= n; i++)
        {
            var aOuter = start + i * angleStep;
            var aInner = aOuter - angleStep / 2;
            var pInner = new Vec(cx + inner * Math.Cos(aInner), cy + inner * Math.Sin(aInner));
            segs.Add(new LineSegment(prev, pInner));
            var pOuter = i == n
                ? first
                : new Vec(cx + radius * Math.Cos(aOuter), cy + radius * Math.Sin(aOuter));
            segs.Add(new LineSegment(pInner, pOuter));
            prev = pOuter;
        }
        return new Path { Closed = true, Segments = segs };
    }
}
