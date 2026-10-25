using System.Windows;
using MakerCam.Core;

namespace MakerCam.App;

public readonly record struct View(double PanX, double PanY, double Zoom)
{
    public static View Default => new(0, 400, 4);
}

public enum Tool
{
    Select,
    Pan,
    Pen,
}

/// <summary>
/// World/screen mapping. World units are millimetres with Y up; screen units
/// are WPF device-independent pixels with Y down.
/// </summary>
public static class ViewMath
{
    public static Vec WorldToScreen(View view, Vec p) =>
        new(view.PanX + p.X * view.Zoom, view.PanY - p.Y * view.Zoom);

    public static Vec ScreenToWorld(View view, Vec p) =>
        new((p.X - view.PanX) / view.Zoom, (view.PanY - p.Y) / view.Zoom);

    public static View FitView(Bounds bounds, double width, double height, double margin = 48)
    {
        var w = Math.Max(bounds.MaxX - bounds.MinX, 1e-3);
        var h = Math.Max(bounds.MaxY - bounds.MinY, 1e-3);
        var zoom = Math.Min((width - margin * 2) / w, (height - margin * 2) / h);
        var cx = (bounds.MinX + bounds.MaxX) / 2;
        var cy = (bounds.MinY + bounds.MaxY) / 2;
        return new View(
            width / 2 - cx * zoom,
            height / 2 + cy * zoom,
            zoom);
    }
}
