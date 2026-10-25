using System.Text.RegularExpressions;

namespace MakerCam.Core.Tests;

public class SvgTests
{
    private const string SimpleSvg = """
        <?xml version="1.0"?>
        <svg xmlns="http://www.w3.org/2000/svg" width="100mm" height="50mm" viewBox="0 0 100 50">
          <rect x="10" y="10" width="30" height="20"/>
          <circle cx="70" cy="25" r="10"/>
          <path d="M0 0 L50 0 L50 25 Z"/>
        </svg>
        """;

    [Fact]
    public void ImportsBasicShapesWithPhysicalUnits()
    {
        var r = SvgImporter.ParseSvg(SimpleSvg);
        Assert.Equal(3, r.Paths.Count);
        Assert.Equal(100, r.WidthMm, 6);
        Assert.Equal(50, r.HeightMm, 6);
    }

    [Fact]
    public void FlipsYSoTheModelIsYUp()
    {
        var r = SvgImporter.ParseSvg(
            """<svg xmlns="http://www.w3.org/2000/svg" width="100mm" height="100mm" viewBox="0 0 100 100"><rect x="0" y="0" width="100" height="100"/></svg>""");
        var b = Geom.PolygonBounds(Geom.FlattenPath(r.Paths[0]));
        Assert.Equal(0, b.MinX, 5);
        Assert.Equal(0, b.MinY, 5);
        Assert.Equal(100, b.MaxX, 5);
        Assert.Equal(100, b.MaxY, 5);
    }

    [Fact]
    public void AppliesGroupTransforms()
    {
        var svg = """
            <svg xmlns="http://www.w3.org/2000/svg" width="100mm" height="100mm" viewBox="0 0 100 100">
              <g transform="translate(20 30)"><rect x="0" y="0" width="10" height="10"/></g></svg>
            """;
        var r = SvgImporter.ParseSvg(svg);
        var b = Geom.PolygonBounds(Geom.FlattenPath(r.Paths[0]));
        Assert.Equal(20, b.MinX, 5);
        // SVG y=30..40 with height 100 -> model y=60..70
        Assert.Equal(60, b.MinY, 5);
        Assert.Equal(70, b.MaxY, 5);
    }

    [Fact]
    public void ParsesPolygonAndPolyline()
    {
        var svg = """
            <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
              <polygon points="0,0 10,0 10,10"/>
              <polyline points="20,20 30,20 30,30"/>
            </svg>
            """;
        var r = SvgImporter.ParseSvg(svg);
        Assert.Equal(2, r.Paths.Count);
        Assert.True(r.Paths[0].Closed);
        Assert.False(r.Paths[1].Closed);
    }

    [Fact]
    public void IgnoresHiddenElementsAndHonoursStyleTransforms()
    {
        var svg = """
            <svg xmlns="http://www.w3.org/2000/svg" width="100mm" height="100mm" viewBox="0 0 100 100">
              <rect x="0" y="0" width="10" height="10" style="display:none"/>
              <rect x="0" y="0" width="10" height="10" style="transform: translate(40px, 0px)"/>
            </svg>
            """;
        var r = SvgImporter.ParseSvg(svg);
        var path = Assert.Single(r.Paths);
        var b = Geom.PolygonBounds(Geom.FlattenPath(path));
        Assert.Equal(40, b.MinX, 4);
    }

    [Fact]
    public void WarnsAboutTextElements()
    {
        var r = SvgImporter.ParseSvg(
            """<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><text x="1" y="1">hi</text></svg>""");
        Assert.Contains(r.Warnings, w => Regex.IsMatch(w, "text", RegexOptions.IgnoreCase));
    }

    [Fact]
    public void SerialisesAPathBackToSvgData()
    {
        var r = SvgImporter.ParseSvg(SimpleSvg);
        var d = SvgImporter.PathToSvgD(r.Paths[0], p => p);
        Assert.StartsWith("M", d);
        Assert.EndsWith("Z", d);
    }

    [Fact]
    public void SavesAndRestoresPathsAndOperations()
    {
        var imported = SvgImporter.ParseSvg(SimpleSvg);
        var paths = imported.Paths;
        var ops = new List<OpDefinition>
        {
            new()
            {
                Id = "op1",
                Type = OperationType.Profile,
                Name = "outside cut",
                Params = OperationParams.Defaults(Unit.Mm),
                PathIds = { paths[0].Id! },
            },
        };
        ops[0].Params.ToolDiameter = 6;
        ops[0].Params.TargetDepth = -5;
        ops[0].Params.Stepdown = 2.5;

        var svg = ProjectIO.SerializeProject(paths, ops, Unit.Mm);
        var project = ProjectIO.ParseProject(svg);
        Assert.NotNull(project);
        Assert.Equal(paths.Count, project!.Paths.Count);
        var op = Assert.Single(project.Operations);
        Assert.Equal("outside cut", op.Name);
        Assert.Equal(6, op.Params.ToolDiameter, 5);
        Assert.Single(op.PathIds);

        // The referenced path must exist in the restored drawing.
        var referenced = project.Paths.FirstOrDefault(p => p.Id == op.PathIds[0]);
        Assert.NotNull(referenced);
        Assert.True(Math.Abs(Geom.PolygonArea(Geom.FlattenPath(referenced!))) > 0);
    }

    [Fact]
    public void ReadsOriginalPartKamFlashMetadata()
    {
        var original = """
            <?xml version="1.0"?>
            <svg xmlns="http://www.w3.org/2000/svg" width="10in" height="10in" viewBox="0 0 720 720">
              <metadata>
                <cutobject type="profile" unit="imperial" name="profile 1" safetyheight="0.5" stocksurface="0" targetdepth="-0.75" stepdown="0.05" feedrate="60" plungerate="30" tooldiameter="0.25" roughingclearance="0" outside="true" direction="1">
                  <path>path0</path>
                </cutobject>
              </metadata>
              <path id="path0" d="M100 100 L200 100 L200 200 Z"/>
            </svg>
            """;
        var project = ProjectIO.ParseProject(original);
        Assert.NotNull(project);
        var op = Assert.Single(project!.Operations);
        Assert.Equal(OperationType.Profile, op.Type);
        Assert.Equal(6.35, op.Params.ToolDiameter, 3);
        Assert.Equal(-19.05, op.Params.TargetDepth, 3);
        Assert.Equal(1.27, op.Params.Stepdown, 3);
        Assert.Single(op.PathIds);
    }

    [Fact]
    public void ReturnsNullForAPlainSvgWithoutCamMetadata()
    {
        Assert.Null(ProjectIO.ParseProject(SimpleSvg));
    }
}
