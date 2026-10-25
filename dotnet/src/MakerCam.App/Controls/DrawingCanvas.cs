using System.Windows;
using System.Windows.Media;

namespace MakerCam.App;

/// <summary>
/// Hosts the renderer. All drawing is done in device-independent pixels, with
/// the renderer applying the world-to-screen mapping itself.
/// </summary>
public sealed class DrawingCanvas : FrameworkElement
{
    private RenderOptions _options = new();

    public RenderOptions Options
    {
        get => _options;
        set
        {
            _options = value;
            InvalidateVisual();
        }
    }

    public DrawingCanvas()
    {
        Focusable = true;
        ClipToBounds = true;
        SnapsToDevicePixels = true;
    }

    protected override void OnRender(DrawingContext dc)
    {
        var dpi = VisualTreeHelper.GetDpi(this).PixelsPerDip;
        Renderer.Render(dc, RenderSize, _options, dpi);
    }

    protected override void OnRenderSizeChanged(SizeChangedInfo sizeInfo)
    {
        base.OnRenderSizeChanged(sizeInfo);
        InvalidateVisual();
    }
}
