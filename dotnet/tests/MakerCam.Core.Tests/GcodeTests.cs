namespace MakerCam.Core.Tests;

public class GcodeTests
{
    private static Operation Op(
        Action<Operation>? over = null,
        Action<OperationParams>? paramsOver = null)
    {
        var op = new Operation
        {
            Id = "op1",
            Type = OperationType.Profile,
            Name = "profile 1",
            Params = OperationParams.Defaults(Unit.Mm),
            PathIds = { "p1" },
            Loops =
            {
                new Loop
                {
                    Points =
                    {
                        new Vec(0, 0),
                        new Vec(10, 0),
                        new Vec(10, 10),
                        new Vec(0, 10),
                    },
                    Depth = 0,
                    Closed = true,
                    PocketDepth = 0,
                    Tabs = new List<Tab>(),
                },
            },
            DrillPoints = new List<Vec>(),
            Processed = true,
            Visible = true,
        };
        paramsOver?.Invoke(op.Params);
        over?.Invoke(op);
        return op;
    }

    [Fact]
    public void EmitsAMetricPreambleAndFooter()
    {
        var g = GcodeGenerator.Generate(
            new[]
            {
                Op(paramsOver: p => { p.StockSurface = 0; p.TargetDepth = -5; p.Stepdown = 5; }),
            },
            Unit.Mm);
        Assert.Contains("G21 G90 G40", g);
        Assert.Contains("G0 Z", g);
        Assert.Contains("G1 Z-5", g);
        Assert.Contains("M5", g);
        Assert.Contains("M30", g);
        Assert.Contains("(profile 1)", g);
    }

    [Fact]
    public void ConvertsCoordinatesAndFeedsToInches()
    {
        var g = GcodeGenerator.Generate(
            new[]
            {
                Op(paramsOver: p =>
                {
                    p.StockSurface = 0;
                    p.TargetDepth = -5;
                    p.Stepdown = 5;
                    p.Feedrate = 254;
                }),
            },
            Unit.In);
        Assert.Contains("G20 G90 G40", g);
        // 10 mm = 0.3937 in; 254 mm/min = 10 in/min
        Assert.Contains("X0.3937", g);
        Assert.Contains("F10", g);
    }

    [Fact]
    public void EmitsMultipleDepthSlices()
    {
        var g = GcodeGenerator.Generate(
            new[]
            {
                Op(paramsOver: p => { p.StockSurface = 0; p.TargetDepth = -10; p.Stepdown = 5; }),
            },
            Unit.Mm);
        Assert.Contains("G1 Z-5", g);
        Assert.Contains("G1 Z-10", g);
    }

    [Fact]
    public void LiftsOverTabsDuringProfileCuts()
    {
        var op = Op(paramsOver: p =>
        {
            p.StockSurface = 0;
            p.TargetDepth = -5;
            p.Stepdown = 5;
            p.TabHeight = 2;
        });
        op.Loops[0].Tabs = new List<Tab> { new(5, 2, 2) };
        var g = GcodeGenerator.Generate(new[] { op }, Unit.Mm);
        // Tab top = target depth (-5) + tab height (2) = -3.
        Assert.Contains("G1 Z-3", g);
    }

    [Fact]
    public void EmitsDrillPecks()
    {
        var op = Op(
            o =>
            {
                o.Type = OperationType.Drill;
                o.Loops = new List<Loop>();
                o.DrillPoints = new List<Vec> { new(5, 5) };
            },
            p =>
            {
                p.StockSurface = 0;
                p.TargetDepth = -6;
                p.Stepdown = 3;
            });
        var g = GcodeGenerator.Generate(new[] { op }, Unit.Mm);
        Assert.Contains("G0 X5 Y5", g);
        Assert.Contains("G1 Z-3", g);
        Assert.Contains("G1 Z-6", g);
    }

    [Fact]
    public void EmitsADrillCycleForHolesAlongAPath()
    {
        var op = Op(
            o =>
            {
                o.Type = OperationType.DrillPath;
                o.Loops = new List<Loop>();
                o.DrillPoints = new List<Vec> { new(5, 5), new(25, 5) };
            },
            p =>
            {
                p.StockSurface = 0;
                p.TargetDepth = -6;
                p.Stepdown = 3;
            });
        var g = GcodeGenerator.Generate(new[] { op }, Unit.Mm);
        Assert.Contains("(profile 1)", g);
        Assert.Contains("G0 X5 Y5", g);
        Assert.Contains("G0 X25 Y5", g);
        Assert.Contains("G1 Z-3", g);
        Assert.Contains("G1 Z-6", g);
    }

    [Fact]
    public void AssignsToolNumbersByDescendingDiameter()
    {
        var a = Op(
            o => { o.Id = "a"; o.Name = "big"; },
            p => { p.ToolDiameter = 10; p.StockSurface = 0; p.TargetDepth = -2; p.Stepdown = 2; });
        var b = Op(
            o => { o.Id = "b"; o.Name = "small"; },
            p => { p.ToolDiameter = 3; p.StockSurface = 0; p.TargetDepth = -2; p.Stepdown = 2; });

        var g = GcodeGenerator.Generate(new[] { a, b }, Unit.Mm);
        // 10 mm tool is T0, 3 mm tool is T1.
        Assert.Contains("T0 M6", g);
        Assert.Contains("T1 M6", g);
        Assert.True(g.IndexOf("T0 M6", StringComparison.Ordinal) <
                    g.IndexOf("T1 M6", StringComparison.Ordinal));
    }
}
