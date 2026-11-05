namespace MakerCam.Core.Tests;

public class CamTests
{
    private static OperationParams Params(Action<OperationParams>? over = null)
    {
        var p = OperationParams.Defaults(Unit.Mm);
        over?.Invoke(p);
        return p;
    }

    private static Path Square(double size = 100)
    {
        var p = Shapes.RectPath(0, 0, size, size);
        p.Id = "sq";
        return p;
    }

    private static Path Circle(double radius = 50)
    {
        var p = Shapes.EllipsePath(0, 0, radius, radius);
        p.Id = "c";
        return p;
    }

    [Fact]
    public void GrowsASquareByTheCutterRadiusForAnOutsideProfile()
    {
        var loops = CamEngine.PathsToLoops(new[] { Square() }, 0.01);
        var output = CamEngine.OffsetRegion(loops, 5);
        var loop = Assert.Single(output);
        var b = Geom.PolygonBounds(loop.Points);
        Assert.Equal(-5, b.MinX, 1);
        Assert.Equal(-5, b.MinY, 1);
        Assert.Equal(105, b.MaxX, 1);
        Assert.Equal(105, b.MaxY, 1);
    }

    [Fact]
    public void ShrinksASquareByTheCutterRadiusForAnInsideProfile()
    {
        var loops = CamEngine.PathsToLoops(new[] { Square() }, 0.01);
        var output = CamEngine.OffsetRegion(loops, -5);
        var loop = Assert.Single(output);
        var b = Geom.PolygonBounds(loop.Points);
        Assert.Equal(5, b.MinX, 1);
        Assert.Equal(95, b.MaxX, 1);
    }

    [Fact]
    public void OffsetsASquareWithAHoleInTheCorrectDirection()
    {
        var outer = Shapes.RectPath(0, 0, 100, 100);
        outer.Id = "o";
        var hole = Shapes.RectPath(30, 30, 40, 40);
        hole.Id = "h";

        var loops = CamEngine.PathsToLoops(new[] { outer, hole }, 0.01);
        Assert.Equal(2, loops.Count);

        var grown = CamEngine.OffsetRegion(loops, 5);
        // Outer expands to 110x110 and the hole shrinks to 30x30.
        var areas = grown
            .Select(l => Math.Abs(Geom.PolygonArea(l.Points)))
            .OrderByDescending(a => a)
            .ToList();
        Assert.True(areas[0] > 11500);
        Assert.True(areas[1] < 1000);
    }

    [Fact]
    public void CreatesAnOutsideProfileWithAnOffsetBoundary()
    {
        var result = CamEngine.GenerateToolpath(
            OperationType.Profile,
            Params(p => { p.Outside = true; p.ToolDiameter = 10; }),
            new[] { Square() },
            0.01);
        Assert.Empty(result.Warnings);
        var loop = Assert.Single(result.Loops);
        Assert.Equal(-5, Geom.PolygonBounds(loop.Points).MinX, 1);
    }

    [Fact]
    public void CreatesAnInsideProfile()
    {
        var result = CamEngine.GenerateToolpath(
            OperationType.Profile,
            Params(p => { p.Outside = false; p.ToolDiameter = 10; }),
            new[] { Square() },
            0.01);
        var loop = Assert.Single(result.Loops);
        Assert.Equal(5, Geom.PolygonBounds(loop.Points).MinX, 1);
    }

    [Fact]
    public void CreatesMultipleConcentricPocketLoops()
    {
        var result = CamEngine.GenerateToolpath(
            OperationType.Pocket,
            Params(p => { p.ToolDiameter = 10; p.Stepover = 0.4; }),
            new[] { Square() },
            0.05);
        Assert.True(result.Loops.Count > 2);
        Assert.True(result.Loops.Select(l => l.PocketDepth).Distinct().Count() > 2);
        var first = result.Loops.First(l => l.PocketDepth == 0);
        Assert.Equal(5, Geom.PolygonBounds(first.Points).MinX, 0);
    }

    [Fact]
    public void FollowsACircleWithoutOffsettingIt()
    {
        var result = CamEngine.GenerateToolpath(
            OperationType.Follow,
            Params(p => p.ToolDiameter = 6),
            new[] { Circle() },
            0.02);
        var loop = Assert.Single(result.Loops);
        Assert.True(loop.Closed);
        var b = Geom.PolygonBounds(loop.Points);
        Assert.Equal(-50, b.MinX, 0);
        Assert.Equal(50, b.MaxX, 0);
    }

    [Fact]
    public void FollowsAnOpenPath()
    {
        var line = new Path
        {
            Id = "l",
            Closed = false,
            Segments = { new LineSegment(new Vec(0, 0), new Vec(100, 0)) },
        };
        var result = CamEngine.GenerateToolpath(OperationType.Follow, Params(), new[] { line }, 0.02);
        var loop = Assert.Single(result.Loops);
        Assert.False(loop.Closed);
        Assert.Equal(2, loop.Points.Count);
    }

    [Fact]
    public void NamesASkippedOpenPathAndReportsItsGap()
    {
        var open = new Path
        {
            Id = "gap-path",
            Name = "Outer plate",
            Closed = false,
            Segments = { new LineSegment(new Vec(0, 0), new Vec(10, 0)) },
        };
        var result = CamEngine.GenerateToolpath(OperationType.Profile, Params(), new[] { open }, 0.02);

        Assert.Empty(result.Loops);
        Assert.Contains("Outer plate", result.Warnings[0]);
        Assert.Contains("10 mm", result.Warnings[0]);
        Assert.Contains(result.Warnings, w => w.Contains("closed path", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public void WarnsAboutOpenPathsEvenWhenClosedPathsAreUsable()
    {
        var open = new Path
        {
            Id = "gap-path",
            Closed = false,
            Segments = { new LineSegment(new Vec(0, 0), new Vec(10, 0)) },
        };
        var result = CamEngine.GenerateToolpath(
            OperationType.Profile,
            Params(p => { p.Outside = true; p.ToolDiameter = 6; }),
            new[] { Square(50), open },
            0.01);

        Assert.NotEmpty(result.Loops);
        Assert.Contains(result.Warnings, w => w.Contains("gap-path"));
    }

    [Fact]
    public void FindsDrillCentres()
    {
        var result = CamEngine.GenerateToolpath(
            OperationType.Drill,
            Params(p => p.Center = true),
            new[] { Square() },
            0.02);
        var point = Assert.Single(result.DrillPoints);
        Assert.Equal(50, point.X, 0);
        Assert.Equal(50, point.Y, 0);
    }

    [Fact]
    public void CreatesAFillDrillingPattern()
    {
        var result = CamEngine.GenerateToolpath(
            OperationType.Drill,
            Params(p => { p.Center = false; p.Spacing = 20; }),
            new[] { Square() },
            0.02);
        Assert.True(result.DrillPoints.Count > 10);
    }

    [Fact]
    public void PlacesAFixedNumberOfHolesAlongAnOpenPath()
    {
        var line = new Path
        {
            Id = "l",
            Closed = false,
            Segments = { new LineSegment(new Vec(0, 0), new Vec(120, 0)) },
        };
        var result = CamEngine.GenerateToolpath(
            OperationType.DrillPath,
            Params(p => p.HoleCount = 4),
            new[] { line },
            0.02);

        Assert.Empty(result.Warnings);
        Assert.Empty(result.Loops);
        Assert.Equal(4, result.DrillPoints.Count);
        Assert.Equal(0, result.DrillPoints[0].X, 6);
        Assert.Equal(40, result.DrillPoints[1].X, 6);
        Assert.Equal(80, result.DrillPoints[2].X, 6);
        Assert.Equal(120, result.DrillPoints[3].X, 6);
        Assert.All(result.DrillPoints, p => Assert.Equal(0, p.Y, 6));
    }

    [Fact]
    public void PlacesHolesEvenlyAroundAClosedPath()
    {
        var result = CamEngine.GenerateToolpath(
            OperationType.DrillPath,
            Params(p => p.HoleCount = 4),
            new[] { Square() },
            0.02);

        Assert.Equal(4, result.DrillPoints.Count);
        Assert.Equal(0, result.DrillPoints[0].X, 6);
        Assert.Equal(0, result.DrillPoints[0].Y, 6);
        Assert.Equal(100, result.DrillPoints[1].X, 6);
        Assert.Equal(0, result.DrillPoints[1].Y, 6);
        Assert.Equal(100, result.DrillPoints[2].X, 6);
        Assert.Equal(100, result.DrillPoints[2].Y, 6);
        Assert.Equal(0, result.DrillPoints[3].X, 6);
        Assert.Equal(100, result.DrillPoints[3].Y, 6);
    }

    [Fact]
    public void PutsASingleHoleAtTheMidpointOfAnOpenPath()
    {
        var line = new Path
        {
            Id = "l",
            Closed = false,
            Segments = { new LineSegment(new Vec(10, 20), new Vec(30, 20)) },
        };
        var result = CamEngine.GenerateToolpath(
            OperationType.DrillPath,
            Params(p => p.HoleCount = 1),
            new[] { line },
            0.02);

        var point = Assert.Single(result.DrillPoints);
        Assert.Equal(20, point.X, 6);
        Assert.Equal(20, point.Y, 6);
    }

    [Fact]
    public void AddsTabsAlongALoop()
    {
        var loops = CamEngine.ApplyDirection(
            CamEngine.OffsetRegion(CamEngine.PathsToLoops(new[] { Square() }, 0.02), 5),
            Direction.CounterClockwise);
        var withTabs = CamEngine.AddTabsToLoops(loops, 30, 5, 3);
        Assert.NotEmpty(withTabs[0].Tabs);
        foreach (var tab in withTabs[0].Tabs)
        {
            Assert.Equal(5, tab.Width);
            Assert.Equal(3, tab.Height);
        }
    }

    [Fact]
    public void SplitsASelfIntersectingBowTieIntoValidLoops()
    {
        var bowtie = new Path
        {
            Id = "bow",
            Closed = true,
            Segments =
            {
                new LineSegment(new Vec(0, 0), new Vec(10, 10)),
                new LineSegment(new Vec(10, 10), new Vec(10, 0)),
                new LineSegment(new Vec(10, 0), new Vec(0, 10)),
                new LineSegment(new Vec(0, 10), new Vec(0, 0)),
            },
        };
        var loops = CamEngine.PathsToLoops(new[] { bowtie }, 0.01);
        Assert.Equal(2, loops.Count);
        foreach (var loop in loops)
        {
            Assert.True(Math.Abs(Geom.PolygonArea(loop.Points)) > 1);
        }
        var result = CamEngine.GenerateToolpath(
            OperationType.Profile,
            Params(p => p.ToolDiameter = 2),
            new[] { bowtie },
            0.01);
        Assert.True(result.Loops.Count >= 1);
    }

    [Fact]
    public void TreatsPartiallyOverlappingPathsAsTwoOuterBoundaries()
    {
        var a = Shapes.RectPath(0, 0, 10, 10);
        a.Id = "a";
        var b = Shapes.RectPath(5, 5, 10, 10);
        b.Id = "b";

        var loops = CamEngine.PathsToLoops(new[] { a, b }, 0.001);
        Assert.Equal(2, loops.Count);
        Assert.All(loops, l => Assert.Equal(0, l.Depth));
    }

    [Fact]
    public void TreatsAFullyEnclosedPathAsAHole()
    {
        var outer = Shapes.RectPath(0, 0, 20, 20);
        outer.Id = "o";
        var inner = Shapes.RectPath(5, 5, 10, 10);
        inner.Id = "i";

        var loops = CamEngine.PathsToLoops(new[] { outer, inner }, 0.001);
        Assert.Equal(new[] { 0, 1 }, loops.Select(l => l.Depth).OrderBy(d => d).ToArray());
    }

    [Fact]
    public void RejectsOpenPathsForProfileOperations()
    {
        var open = new Path
        {
            Id = "o",
            Closed = false,
            Segments = { new LineSegment(new Vec(0, 0), new Vec(10, 0)) },
        };
        var result = CamEngine.GenerateToolpath(OperationType.Profile, Params(), new[] { open }, 0.02);
        Assert.Empty(result.Loops);
        Assert.NotEmpty(result.Warnings);
    }
}
