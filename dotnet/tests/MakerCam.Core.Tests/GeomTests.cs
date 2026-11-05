namespace MakerCam.Core.Tests;

public class GeomTests
{
    [Fact]
    public void ParsesLinesAndClosesASubpath()
    {
        var subs = SvgPathData.Parse("M0 0 L10 0 L10 10 Z");
        var sub = Assert.Single(subs);
        Assert.Equal(3, sub.Segments.Count);
        Assert.True(sub.Closed);
        Assert.Equal(new Vec(0, 0), sub.Segments[0].P1);
        Assert.Equal(new Vec(0, 0), sub.Segments[^1].P2);
    }

    [Fact]
    public void ParsesRelativeCommandsAndRepeatedCoordinateSets()
    {
        var subs = SvgPathData.Parse("m 0 0 l 10 0 0 10 z");
        Assert.Equal(3, subs[0].Segments.Count);
        Assert.Equal(new Vec(10, 10), subs[0].Segments[1].P2);
    }

    [Fact]
    public void ParsesCubicSmoothCubicQuadraticAndSmoothQuadraticCurves()
    {
        var subs = SvgPathData.Parse("M0 0 C1 2 3 4 5 6 S7 8 9 10 Q11 12 13 14 T15 16");
        Assert.Equal(
            new[] { SegmentKind.Cubic, SegmentKind.Cubic, SegmentKind.Quad, SegmentKind.Quad },
            subs[0].Segments.Select(s => s.Kind).ToArray());
    }

    [Fact]
    public void ParsesMultipleSubpaths()
    {
        var subs = SvgPathData.Parse("M0 0 L10 0 M20 20 L30 20");
        Assert.Equal(2, subs.Count);
        Assert.Equal(new Vec(20, 20), subs[1].Segments[0].P1);
    }

    [Fact]
    public void ConvertsAnEllipticalArcToCubics()
    {
        var subs = SvgPathData.Parse("M0 0 A10 10 0 0 1 20 0");
        var segs = subs[0].Segments;
        Assert.NotEmpty(segs);
        Assert.Equal(20, segs[^1].P2.X, 6);
        Assert.Equal(0, segs[^1].P2.Y, 6);

        // A semi-circle must bulge away from the chord, not collapse to a line.
        var pts = Geom.FlattenPath(new Path { Segments = segs, Closed = false }, 0.01);
        var maxAbsY = pts.Max(p => Math.Abs(p.Y));
        Assert.True(maxAbsY > 9.9);
        Assert.True(maxAbsY < 10.1);
    }

    [Fact]
    public void BuildsAClosedRectangularPathWithPositiveArea()
    {
        var p = Shapes.RectPath(0, 0, 10, 20);
        Assert.True(Geom.IsClosedPath(p));
        var pts = Geom.FlattenPath(p);
        Assert.Equal(200, Math.Abs(Geom.PolygonArea(pts)), 6);
        Assert.Equal(new Bounds(0, 0, 10, 20), Geom.PolygonBounds(pts));
    }

    [Fact]
    public void FlattensAnEllipseToASmoothClosedPolygon()
    {
        var p = Shapes.EllipsePath(0, 0, 10, 5);
        var pts = Geom.FlattenPath(p, 0.01);
        Assert.True(pts.Count > 20);
        var area = Math.Abs(Geom.PolygonArea(pts));
        Assert.True(area > 140);
        Assert.True(area < 165);
    }

    [Fact]
    public void TestsPointInPolygon()
    {
        var pts = new[]
        {
            new Vec(0, 0), new Vec(10, 0), new Vec(10, 10), new Vec(0, 10),
        };
        Assert.True(Geom.PointInPolygon(pts, new Vec(5, 5)));
        Assert.False(Geom.PointInPolygon(pts, new Vec(15, 5)));
    }

    [Fact]
    public void PreservesIdsWhenCloningAPath()
    {
        var p = Shapes.RectPath(0, 0, 10, 10);
        p.Id = "keep-me";
        Assert.Equal("keep-me", p.Clone().Id);
    }

    [Fact]
    public void ReversesAPathWithoutChangingItsShape()
    {
        var p = Shapes.RectPath(0, 0, 10, 10);
        var r = Geom.ReversePath(p);
        Assert.Equal(p.Segments[^1].P2, r.Segments[0].P1);
        Assert.Equal(100, Math.Abs(Geom.PolygonArea(Geom.FlattenPath(r))), 6);
    }

    [Fact]
    public void ComposesTranslateAndScaleInTheExpectedOrder()
    {
        var m = Geom.MatrixMultiply(Geom.MatrixTranslate(10, 20), Geom.MatrixScale(2));
        var p = Geom.TransformPath(Shapes.RectPath(0, 0, 10, 10), m);
        var b = Geom.PolygonBounds(Geom.FlattenPath(p));
        Assert.Equal(10, b.MinX, 6);
        Assert.Equal(20, b.MinY, 6);
        Assert.Equal(30, b.MaxX, 6);
        Assert.Equal(40, b.MaxY, 6);
    }

    [Fact]
    public void RotatesAroundTheOrigin()
    {
        var m = Geom.MatrixRotate(Math.PI / 2);
        var p = Geom.TransformPath(Shapes.RectPath(0, 0, 10, 0), m);
        var b = Geom.PolygonBounds(Geom.FlattenPath(p));
        Assert.Equal(0, b.MinX, 6);
        Assert.Equal(10, b.MaxY, 6);
        Assert.Equal(0, b.MinY, 6);
    }

    private static Path LinePath(string id, double x1, double y1, double x2, double y2) => new()
    {
        Id = id,
        Closed = false,
        Segments = { new LineSegment(new Vec(x1, y1), new Vec(x2, y2)) },
    };

    private static Path NearClosedPath() => new()
    {
        Id = "gap",
        Closed = false,
        Segments =
        {
            new LineSegment(new Vec(0, 0), new Vec(10, 0)),
            new LineSegment(new Vec(10, 0), new Vec(10, 10)),
            new LineSegment(new Vec(10, 10), new Vec(0, 0.05)),
        },
    };

    [Fact]
    public void ClosesAPathGapWithinTolerance()
    {
        var path = NearClosedPath();
        Assert.True(Geom.ClosePathGap(path, 0.1));
        Assert.True(path.Closed);
        Assert.Equal(4, path.Segments.Count);
        Assert.Equal(new Vec(0, 0), path.Segments[^1].P2);
    }

    [Fact]
    public void LeavesALargerGapUntouched()
    {
        var path = NearClosedPath();
        Assert.False(Geom.ClosePathGap(path, 0.01));
        Assert.False(path.Closed);
        Assert.Equal(3, path.Segments.Count);
    }

    [Fact]
    public void JoinsTwoPathsWhoseEndsMeet()
    {
        var a = LinePath("a", 0, 0, 10, 0);
        var b = LinePath("b", 10, 0, 20, 0);
        var result = Geom.JoinOpenPaths(new[] { a, b }, 0.001);

        Assert.Equal(1, result.Joins);
        Assert.Same(a, Assert.Single(result.Paths));
        Assert.Same(a, result.Absorbed[b]);
        Assert.Equal(2, a.Segments.Count);
        Assert.Equal(new[] { 0.0, 10.0, 20.0 }, Geom.FlattenPath(a).Select(p => p.X));
    }

    [Fact]
    public void ReversesPathsWhenOppositeEndsMeet()
    {
        var a = LinePath("a", 0, 0, 10, 0);
        var b = LinePath("b", 20, 0, 10, 0);
        var result = Geom.JoinOpenPaths(new[] { a, b }, 0.001);

        Assert.Equal(1, result.Joins);
        Assert.Equal(new[] { 0.0, 10.0, 20.0 }, Geom.FlattenPath(a).Select(p => p.X));
    }

    [Fact]
    public void BridgesASmallGapBetweenEnds()
    {
        var a = LinePath("a", 0, 0, 10, 0);
        var b = LinePath("b", 10.2, 0, 20, 0);
        var result = Geom.JoinOpenPaths(new[] { a, b }, 0.5);

        Assert.Equal(1, result.Joins);
        Assert.Equal(3, a.Segments.Count);
        var bridge = Assert.IsType<LineSegment>(a.Segments[1]);
        Assert.Equal(new Vec(10, 0), bridge.P1);
        Assert.Equal(new Vec(10.2, 0), bridge.P2);
    }

    [Fact]
    public void DoesNotJoinEndsBeyondTolerance()
    {
        var a = LinePath("a", 0, 0, 10, 0);
        var b = LinePath("b", 11, 0, 20, 0);
        var result = Geom.JoinOpenPaths(new[] { a, b }, 0.5);

        Assert.Equal(0, result.Joins);
        Assert.Equal(2, result.Paths.Count);
    }
}
