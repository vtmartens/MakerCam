namespace MakerCam.Core;

/// <summary>
/// A point or vector in model space. All model coordinates are millimetres
/// with the Y axis pointing up (Cartesian / machining convention).
/// </summary>
public readonly record struct Vec(double X, double Y)
{
    public static readonly Vec Zero = new(0, 0);

    public static Vec Of(double x, double y) => new(x, y);

    public override string ToString() => $"({X}, {Y})";
}
