using System.Globalization;
using System.Xml.Linq;
using Xunit.Abstractions;

namespace MakerCam.Core.Tests;

/// <summary>
/// Guards the physical scale of saved project SVGs. The file uses millimetre
/// user units (1 SVG unit = 1 mm) with a matching width/height and viewBox, so
/// reopening it — at any import DPI — must reproduce the same dimensions.
/// </summary>
public class ProjectScaleTests
{
    private readonly ITestOutputHelper _output;

    public ProjectScaleTests(ITestOutputHelper output) => _output = output;

    private static Path Rect(double width, double height, string id = "r")
    {
        var path = Shapes.RectPath(10, 20, width, height);
        path.Id = id;
        return path;
    }

    [Fact]
    public void SavesMillimetreUserUnits()
    {
        var svg = ProjectIO.SerializeProject(new[] { Rect(100, 50) }, Array.Empty<OpDefinition>());
        var root = XDocument.Parse(svg).Root!;

        Assert.Equal("100mm", root.Attribute("width")!.Value);
        Assert.Equal("50mm", root.Attribute("height")!.Value);
        Assert.Equal("0 0 100 50", root.Attribute("viewBox")!.Value);
    }

    [Fact]
    public void RoundTripPreservesDimensionsForEveryImportResolution()
    {
        var svg = ProjectIO.SerializeProject(new[] { Rect(100, 50) }, Array.Empty<OpDefinition>());

        foreach (var pxPerInch in new[] { 72.0, 90.0, 96.0, 120.0 })
        {
            var imported = SvgImporter.ParseSvg(svg, new SvgImportOptions { PxPerInch = pxPerInch });
            Assert.Equal(100, imported.WidthMm, 4);
            Assert.Equal(50, imported.HeightMm, 4);

            var bounds = Geom.PolygonBounds(Geom.FlattenPath(imported.Paths[0], 0.0001));
            Assert.Equal(100, bounds.MaxX - bounds.MinX, 4);
            Assert.Equal(50, bounds.MaxY - bounds.MinY, 4);
        }
    }

    [Fact]
    public void DisplayUnitsDoNotAffectTheSavedFile()
    {
        var paths = new[] { Rect(100, 50) };
        var millimetres = ProjectIO.SerializeProject(paths, Array.Empty<OpDefinition>(), Unit.Mm);
        var inches = ProjectIO.SerializeProject(paths, Array.Empty<OpDefinition>(), Unit.In);
        Assert.Equal(millimetres, inches);
    }

    [Fact]
    public void CurvedGeometryKeepsItsSizeAndFitsTheViewBox()
    {
        var ellipse = Shapes.EllipsePath(50, 50, 25.4, 12.7);
        ellipse.Id = "e";
        var svg = ProjectIO.SerializeProject(new[] { ellipse }, Array.Empty<OpDefinition>());
        var imported = SvgImporter.ParseSvg(svg);
        var bounds = Geom.PolygonBounds(Geom.FlattenPath(imported.Paths[0], 0.0001));

        _output.WriteLine(
            $"page={imported.WidthMm} x {imported.HeightMm}; " +
            $"bounds=({bounds.MinX},{bounds.MinY})..({bounds.MaxX},{bounds.MaxY})");

        Assert.Equal(50.8, imported.WidthMm, 3);
        Assert.Equal(25.4, imported.HeightMm, 3);
        Assert.Equal(50.8, bounds.MaxX - bounds.MinX, 2);
        Assert.Equal(25.4, bounds.MaxY - bounds.MinY, 2);

        // Curves are serialised exactly; the page must not clip them because of
        // the flattening tolerance used to compute the bounds.
        Assert.True(bounds.MinX >= -0.06, $"left edge outside page: {bounds.MinX}");
        Assert.True(bounds.MinY >= -0.06, $"bottom edge outside page: {bounds.MinY}");
        Assert.True(bounds.MaxX <= imported.WidthMm + 0.06, $"right edge outside page: {bounds.MaxX}");
        Assert.True(bounds.MaxY <= imported.HeightMm + 0.06, $"top edge outside page: {bounds.MaxY}");
    }

    [Fact]
    public void ReadsInkscapeStylePixelViewBoxAtTheCorrectScale()
    {
        // Inkscape commonly writes millimetre document size with a viewBox in
        // user units (1 unit = 1/96 inch). Importing must honour the ratio.
        const string svg = """
            <svg xmlns="http://www.w3.org/2000/svg" width="100mm" height="50mm"
                 viewBox="0 0 377.9527559 188.976378">
              <rect x="0" y="0" width="377.9527559" height="188.976378"/>
            </svg>
            """;

        var imported = SvgImporter.ParseSvg(svg);
        var bounds = Geom.PolygonBounds(Geom.FlattenPath(imported.Paths[0], 0.0001));

        Assert.Equal(100, imported.WidthMm, 3);
        Assert.Equal(50, imported.HeightMm, 3);
        Assert.Equal(100, bounds.MaxX - bounds.MinX, 3);
        Assert.Equal(50, bounds.MaxY - bounds.MinY, 3);

        // Saving that drawing must not accumulate a unit conversion error.
        var saved = ProjectIO.SerializeProject(imported.Paths, Array.Empty<OpDefinition>());
        var root = XDocument.Parse(saved).Root!;
        Assert.Equal("100mm", root.Attribute("width")!.Value);
        Assert.Equal("50mm", root.Attribute("height")!.Value);

        var reopened = SvgImporter.ParseSvg(saved);
        var reopenedBounds = Geom.PolygonBounds(Geom.FlattenPath(reopened.Paths[0], 0.0001));
        Assert.Equal(100, reopened.WidthMm, 3);
        Assert.Equal(50, reopened.HeightMm, 3);
        Assert.Equal(100, reopenedBounds.MaxX - reopenedBounds.MinX, 3);
        Assert.Equal(50, reopenedBounds.MaxY - reopenedBounds.MinY, 3);
    }

    [Fact]
    public void ExplicitPageIsPreservedOnSaveAndReopen()
    {
        var rect = Shapes.RectPath(10, 20, 50, 50);
        rect.Id = "r";

        var svg = ProjectIO.SerializeProject(
            new[] { rect }, Array.Empty<OpDefinition>(), Unit.Mm, 200, 100);

        var root = XDocument.Parse(svg).Root!;
        Assert.Equal("200mm", root.Attribute("width")!.Value);
        Assert.Equal("100mm", root.Attribute("height")!.Value);
        Assert.Equal("0 0 200 100", root.Attribute("viewBox")!.Value);

        var imported = SvgImporter.ParseSvg(svg);
        Assert.Equal(200, imported.WidthMm, 4);
        Assert.Equal(100, imported.HeightMm, 4);

        var bounds = Geom.PolygonBounds(Geom.FlattenPath(imported.Paths[0], 0.0001));
        Assert.Equal(10, bounds.MinX, 4);
        Assert.Equal(20, bounds.MinY, 4);
        Assert.Equal(60, bounds.MaxX, 4);
        Assert.Equal(70, bounds.MaxY, 4);

        // Reopening and saving with the imported page must be byte-stable.
        imported.Paths[0].Id = "r";
        var again = ProjectIO.SerializeProject(
            imported.Paths, Array.Empty<OpDefinition>(), Unit.Mm,
            imported.WidthMm, imported.HeightMm);
        Assert.Equal(svg, again);
    }

    [Fact]
    public void PageSizeDoesNotDependOnContentBounds()
    {
        var small = Shapes.RectPath(10, 20, 10, 10);
        small.Id = "small";
        var large = Shapes.RectPath(0, 0, 150, 90);
        large.Id = "large";

        var smallSvg = XDocument.Parse(ProjectIO.SerializeProject(
            new[] { small }, Array.Empty<OpDefinition>(), Unit.Mm, 200, 120)).Root!;
        var largeSvg = XDocument.Parse(ProjectIO.SerializeProject(
            new[] { large }, Array.Empty<OpDefinition>(), Unit.Mm, 200, 120)).Root!;

        Assert.Equal("200mm", smallSvg.Attribute("width")!.Value);
        Assert.Equal("120mm", smallSvg.Attribute("height")!.Value);
        Assert.Equal(smallSvg.Attribute("width")!.Value, largeSvg.Attribute("width")!.Value);
        Assert.Equal(smallSvg.Attribute("height")!.Value, largeSvg.Attribute("height")!.Value);
        Assert.Equal(smallSvg.Attribute("viewBox")!.Value, largeSvg.Attribute("viewBox")!.Value);
    }

    [Fact]
    public void RoundedPageDimensionsMatchThePathCoordinates()
    {
        var svg = ProjectIO.SerializeProject(new[] { Rect(100.12345, 50.98765) }, Array.Empty<OpDefinition>());
        var root = XDocument.Parse(svg).Root!;
        var width = double.Parse(root.Attribute("width")!.Value.Replace("mm", ""), CultureInfo.InvariantCulture);
        var height = double.Parse(root.Attribute("height")!.Value.Replace("mm", ""), CultureInfo.InvariantCulture);

        Assert.Equal(100.1235, width, 4);
        Assert.Equal(50.9877, height, 4);
        Assert.Equal($"0 0 {JsMath.FormatShort(width)} {JsMath.FormatShort(height)}",
            root.Attribute("viewBox")!.Value);
    }
}
