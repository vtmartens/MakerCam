namespace MakerCam.Core;

public enum Unit
{
    Mm,
    In,
}

/// <summary>1 = counter-clockwise, 2 = clockwise (matches the project format).</summary>
public enum Direction
{
    CounterClockwise = 1,
    Clockwise = 2,
}

public enum OperationType
{
    Profile,
    Pocket,
    Follow,
    Drill,
    DrillPath,
}

public static class Units
{
    public const double MmPerInch = 25.4;

    public static string ToCode(this Unit unit) => unit == Unit.In ? "in" : "mm";

    public static Unit ParseUnit(string? code) =>
        string.Equals(code, "in", StringComparison.OrdinalIgnoreCase) ? Unit.In : Unit.Mm;

    public static string ToCode(this OperationType type) => type switch
    {
        OperationType.Profile => "profile",
        OperationType.Pocket => "pocket",
        OperationType.Follow => "follow",
        OperationType.Drill => "drill",
        OperationType.DrillPath => "drillpath",
        _ => "profile",
    };

    public static OperationType ParseOperationType(string? code) => code switch
    {
        "pocket" => OperationType.Pocket,
        "follow" => OperationType.Follow,
        "drill" => OperationType.Drill,
        "drillpath" => OperationType.DrillPath,
        _ => OperationType.Profile,
    };
}

public sealed record Tab(
    /// <summary>Distance along the loop at which the tab begins.</summary>
    double Start,
    /// <summary>Tab width along the loop.</summary>
    double Width,
    /// <summary>Height of the tab above the target depth.</summary>
    double Height);

public sealed class Loop
{
    public List<Vec> Points { get; set; } = new();

    public int Depth { get; set; }

    public bool Closed { get; set; }

    /// <summary>Pocket depth level (0 = first, boundary-level pass).</summary>
    public int PocketDepth { get; set; }

    public List<Tab> Tabs { get; set; } = new();

    public string? SourceId { get; set; }

    public Loop Clone() => new()
    {
        Points = Points.ToList(),
        Depth = Depth,
        Closed = Closed,
        PocketDepth = PocketDepth,
        Tabs = Tabs.ToList(),
        SourceId = SourceId,
    };

    /// <summary>Returns a copy carrying the same data but different points.</summary>
    public Loop WithPoints(List<Vec> points) => new()
    {
        Points = points,
        Depth = Depth,
        Closed = Closed,
        PocketDepth = PocketDepth,
        Tabs = Tabs,
        SourceId = SourceId,
    };
}

public sealed class OperationParams
{
    public double ToolDiameter { get; set; } // mm
    public double TargetDepth { get; set; } // mm (negative)
    public double SafetyHeight { get; set; } // mm (positive)
    public double StockSurface { get; set; } // mm (0 normally)
    public double Stepdown { get; set; } // mm (positive)
    public double Feedrate { get; set; } // mm/min
    public double PlungeRate { get; set; } // mm/min
    public bool Outside { get; set; } = true; // profile only
    public Direction Direction { get; set; } = Direction.CounterClockwise;
    public double Stepover { get; set; } // fraction of tool diameter (pocket only), 0..1
    public double RoughingClearance { get; set; } // mm (pocket only)
    public bool Center { get; set; } = true; // drill only
    public double Spacing { get; set; } // mm (drill only)
    public int HoleCount { get; set; } = 4; // holes per path (drillpath only)
    public double TabSpacing { get; set; } // mm
    public double TabWidth { get; set; } // mm
    public double TabHeight { get; set; } // mm

    /// <summary>
    /// Defaults mirror the original MakerCam values for the active display
    /// unit. Values are always stored in millimetres.
    /// </summary>
    public static OperationParams Defaults(Unit unit)
    {
        var inch = unit == Unit.In;
        return new OperationParams
        {
            ToolDiameter = inch ? 0.25 * 25.4 : 6.35,
            TargetDepth = inch ? -0.75 * 25.4 : -12,
            SafetyHeight = inch ? 0.5 * 25.4 : 12,
            StockSurface = 0,
            Stepdown = inch ? 0.05 * 25.4 : 2,
            Feedrate = inch ? 60 * 25.4 : 800,
            PlungeRate = inch ? 30 * 25.4 : 300,
            Outside = true,
            Direction = Direction.CounterClockwise,
            Stepover = 0.4,
            RoughingClearance = 0,
            Center = true,
            Spacing = inch ? 0.5 * 25.4 : 12.7,
            HoleCount = 4,
            TabSpacing = inch ? 5 * 25.4 : 60,
            TabWidth = inch ? 0.25 * 25.4 : 6,
            TabHeight = inch ? 0.25 * 25.4 : 3,
        };
    }

    public OperationParams Clone() => (OperationParams)MemberwiseClone();
}

public sealed class Operation
{
    public string Id { get; set; } = "op1";

    public OperationType Type { get; set; } = OperationType.Profile;

    public string Name { get; set; } = "profile 1";

    public OperationParams Params { get; set; } = OperationParams.Defaults(Unit.Mm);

    public List<string> PathIds { get; set; } = new();

    public List<Loop> Loops { get; set; } = new();

    public List<Vec> DrillPoints { get; set; } = new();

    public bool Processed { get; set; } = true;

    public bool Visible { get; set; } = true;
}

/// <summary>An operation as stored in a project file, before toolpaths are generated.</summary>
public sealed class OpDefinition
{
    public string? Id { get; set; }

    public OperationType Type { get; set; } = OperationType.Profile;

    public string Name { get; set; } = string.Empty;

    public OperationParams Params { get; set; } = OperationParams.Defaults(Unit.Mm);

    public List<string> PathIds { get; set; } = new();
}

public sealed class GeneratedToolpath
{
    public List<Loop> Loops { get; init; } = new();

    public List<Vec> DrillPoints { get; init; } = new();

    public List<string> Warnings { get; init; } = new();
}

public sealed class NestOptions
{
    public double Gap { get; set; } // mm between objects
    public List<double> Rotations { get; set; } = new(); // radians
    public double Step { get; set; } // placement scan step in mm
}

public sealed class NestItem
{
    /// <summary>Convex-ish outline of the occupied area, already buffered by gap/2.</summary>
    public List<Vec> Outline { get; set; } = new();

    /// <summary>Original toolpath loops, kept for rendering/regeneration.</summary>
    public List<Loop> SourceLoops { get; set; } = new();
}

public sealed record NestPlacement(int Index, Vec Position, double Rotation);
