namespace MakerCam.Core;

/// <summary>A drawing path: a list of connected (or nearly connected) segments.</summary>
public sealed class Path
{
    public List<Segment> Segments { get; init; } = new();

    public bool Closed { get; set; }

    public string? Name { get; set; }

    /// <summary>Stable id used by CAM operations and the project format.</summary>
    public string? Id { get; set; }

    /// <summary>Optional source metadata (e.g. original SVG element id).</summary>
    public string? SourceId { get; set; }

    public Path Clone() => new()
    {
        Segments = Segments.Select(Geom.CloneSegment).ToList(),
        Closed = Closed,
        Name = Name,
        Id = Id,
        SourceId = SourceId,
    };

    public override string ToString() =>
        $"{Segments.Count} segment(s){(Closed ? ", closed" : string.Empty)}";
}

/// <summary>One subpath produced by the SVG <c>d</c> parser.</summary>
public sealed class SubPathData
{
    public List<Segment> Segments { get; } = new();

    public bool Closed { get; set; }
}
