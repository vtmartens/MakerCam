namespace MakerCam.Core;

public readonly record struct Bounds(double MinX, double MinY, double MaxX, double MaxY)
{
    public double Width => MaxX - MinX;

    public double Height => MaxY - MinY;

    public static readonly Bounds Empty = new(0, 0, 0, 0);
}
