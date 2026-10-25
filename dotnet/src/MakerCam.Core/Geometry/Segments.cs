namespace MakerCam.Core;

public enum SegmentKind
{
    Line,
    Quad,
    Cubic,
}

/// <summary>
/// A path segment. Segments are immutable; edits create new instances so that
/// undo history and toolpaths can share geometry safely.
/// </summary>
public abstract record Segment(Vec P1, Vec P2)
{
    public abstract SegmentKind Kind { get; }

    /// <summary>Returns a copy of this segment with a different start point.</summary>
    public abstract Segment WithP1(Vec p1);
}

public sealed record LineSegment(Vec P1, Vec P2) : Segment(P1, P2)
{
    public override SegmentKind Kind => SegmentKind.Line;

    public override Segment WithP1(Vec p1) => this with { P1 = p1 };
}

public sealed record QuadSegment(Vec P1, Vec C, Vec P2) : Segment(P1, P2)
{
    public override SegmentKind Kind => SegmentKind.Quad;

    public override Segment WithP1(Vec p1) => this with { P1 = p1 };
}

public sealed record CubicSegment(Vec P1, Vec C1, Vec C2, Vec P2) : Segment(P1, P2)
{
    public override SegmentKind Kind => SegmentKind.Cubic;

    public override Segment WithP1(Vec p1) => this with { P1 = p1 };
}
