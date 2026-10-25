namespace MakerCam.Core;

/// <summary>
/// A 2D affine transform in SVG order: x' = a*x + c*y + e, y' = b*x + d*y + f.
/// </summary>
public readonly record struct Matrix(double A, double B, double C, double D, double E, double F)
{
    public static readonly Matrix Identity = new(1, 0, 0, 1, 0, 0);
}
