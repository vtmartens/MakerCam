using ClipperLib;

namespace MakerCam.Core;

/// <summary>
/// CAM engine: turns drawing paths into toolpaths.
///
/// The offsetting uses Clipper 6.4.2 (the same algorithm version as the
/// JavaScript build), so offsets are numerically identical to the web app.
/// </summary>
public static class CamEngine
{
    private const double ClipperScale = 1000; // 1 clipper unit = 0.001 mm
    private const double MinLoopArea = 1e-5; // mm^2

    /* -------------------------------------------------------------- */
    /* Clipper helpers                                                 */
    /* -------------------------------------------------------------- */

    private static List<IntPoint> ToClipper(IReadOnlyList<Vec> points)
    {
        var result = new List<IntPoint>(points.Count);
        foreach (var p in points)
        {
            result.Add(new IntPoint(
                (long)JsMath.Round(p.X * ClipperScale),
                (long)JsMath.Round(p.Y * ClipperScale)));
        }
        return result;
    }

    private static List<Vec> FromClipper(List<IntPoint> path)
    {
        var points = new List<Vec>(path.Count);
        foreach (var p in path) points.Add(new Vec(p.X / ClipperScale, p.Y / ClipperScale));
        return Geom.DedupePoints(points, 1e-6);
    }

    private static double ClipperArea(List<IntPoint> path) =>
        Clipper.Area(path) / (ClipperScale * ClipperScale);

    private static List<IntPoint> ClipperReverse(List<IntPoint> path)
    {
        var result = new List<IntPoint>(path);
        result.Reverse();
        return result;
    }

    private static double ClipperIntersectionArea(IReadOnlyList<Vec> a, IReadOnlyList<Vec> b)
    {
        var clipper = new Clipper();
        clipper.AddPath(ToClipper(a), PolyType.ptSubject, true);
        clipper.AddPath(ToClipper(b), PolyType.ptClip, true);
        var solution = new List<List<IntPoint>>();
        clipper.Execute(ClipType.ctIntersection, solution, PolyFillType.pftNonZero, PolyFillType.pftNonZero);
        var area = 0.0;
        foreach (var p in solution) area += Math.Abs(ClipperArea(p));
        return area;
    }

    /* -------------------------------------------------------------- */
    /* Loop construction                                               */
    /* -------------------------------------------------------------- */

    /// <summary>
    /// Finds a point strictly inside a simple polygon. Used for containment
    /// tests; a vertex or the centroid can fall outside concave shapes.
    /// </summary>
    public static Vec InteriorPoint(IReadOnlyList<Vec> points)
    {
        if (points.Count < 3) return points.Count > 0 ? points[0] : Vec.Zero;
        var b = Geom.PolygonBounds(points);
        var height = b.MaxY - b.MinY;
        var yCandidates = new[]
        {
            b.MinY + height * 0.5,
            b.MinY + height * 0.37,
            b.MinY + height * 0.61,
        };
        foreach (var yBase in yCandidates)
        {
            // Avoid scanning exactly through vertices.
            var y = yBase + height * 1e-4;
            var xs = new List<double>();
            for (var i = 0; i < points.Count; i++)
            {
                var a = points[i];
                var c = points[(i + 1) % points.Count];
                if (a.Y > y != c.Y > y)
                {
                    xs.Add(a.X + (y - a.Y) * (c.X - a.X) / (c.Y - a.Y));
                }
            }
            xs.Sort();
            for (var i = 0; i + 1 < xs.Count; i += 2)
            {
                var p = new Vec((xs[i] + xs[i + 1]) / 2, y);
                if (Geom.PointInPolygon(points, p, false)) return p;
            }
        }

        double cx = 0, cy = 0;
        foreach (var p in points)
        {
            cx += p.X;
            cy += p.Y;
        }
        return new Vec(cx / points.Count, cy / points.Count);
    }

    /// <summary>True when <paramref name="inner"/> lies entirely inside <paramref name="outer"/> (touching allowed).</summary>
    private static bool LoopContains(IReadOnlyList<Vec> outer, IReadOnlyList<Vec> inner)
    {
        var ob = Geom.PolygonBounds(outer);
        var ib = Geom.PolygonBounds(inner);
        const double eps = 1e-6;
        if (ib.MinX < ob.MinX - eps ||
            ib.MinY < ob.MinY - eps ||
            ib.MaxX > ob.MaxX + eps ||
            ib.MaxY > ob.MaxY + eps)
        {
            return false;
        }

        var p = InteriorPoint(inner);
        if (!Geom.PointInPolygon(outer, p, false)) return false;
        var innerArea = Math.Abs(Geom.PolygonArea(inner));
        var inter = ClipperIntersectionArea(inner, outer);
        return inter >= innerArea - Math.Max(1e-6, innerArea * 1e-6);
    }

    /// <summary>
    /// Nesting depth of each loop: 0 = outer, 1 = hole, 2 = island, etc.
    /// Uses full containment, so partially overlapping paths are both treated
    /// as outer boundaries and later unioned by the offset.
    /// </summary>
    public static List<int> ComputeNestingDepths(IReadOnlyList<IReadOnlyList<Vec>> loops)
    {
        var bounds = loops.Select(Geom.PolygonBounds).ToList();
        var points = loops.Select(InteriorPoint).ToList();
        var depths = new List<int>(loops.Count);

        for (var j = 0; j < loops.Count; j++)
        {
            var depth = 0;
            for (var i = 0; i < loops.Count; i++)
            {
                if (i == j) continue;
                var bi = bounds[i];
                var bj = bounds[j];
                if (bj.MinX < bi.MinX - 1e-6 ||
                    bj.MinY < bi.MinY - 1e-6 ||
                    bj.MaxX > bi.MaxX + 1e-6 ||
                    bj.MaxY > bi.MaxY + 1e-6)
                {
                    continue;
                }
                if (!Geom.PointInPolygon(loops[i], points[j], false)) continue;
                if (LoopContains(loops[i], loops[j])) depth++;
            }
            depths.Add(depth);
        }
        return depths;
    }

    /// <summary>
    /// Resolves self-intersections in a single path by running it through
    /// Clipper with an even-odd fill. A bow-tie, for example, becomes two
    /// simple loops.
    /// </summary>
    private static List<List<Vec>> SimplifyPolygon(IReadOnlyList<Vec> points)
    {
        var clipper = new Clipper();
        clipper.AddPath(ToClipper(points), PolyType.ptSubject, true);
        var solution = new List<List<IntPoint>>();
        clipper.Execute(ClipType.ctUnion, solution, PolyFillType.pftEvenOdd, PolyFillType.pftEvenOdd);

        var result = new List<List<Vec>>();
        foreach (var p in solution)
        {
            var pts = FromClipper(p);
            if (pts.Count >= 3 && Math.Abs(Geom.PolygonArea(pts)) >= MinLoopArea) result.Add(pts);
        }
        return result;
    }

    /// <summary>Builds oriented, nested loops from closed drawing paths.</summary>
    public static List<Loop> PathsToLoops(IEnumerable<Path> paths, double tolerance)
    {
        var polygons = new List<List<Vec>>();
        var sourceIds = new List<string?>();

        foreach (var path in paths)
        {
            if (!Geom.IsClosedPath(path)) continue;
            var pts = Geom.DedupePoints(Geom.ClosedPolygon(path, tolerance));
            if (pts.Count < 3) continue;

            List<List<Vec>> loops = SimplifyPolygon(pts);
            if (Math.Abs(Geom.PolygonArea(pts)) >= MinLoopArea && loops.Count == 0)
            {
                loops = new List<List<Vec>> { pts };
            }

            foreach (var loop in loops)
            {
                polygons.Add(loop);
                sourceIds.Add(path.Id);
            }
        }

        if (polygons.Count == 0) return new List<Loop>();
        var depths = ComputeNestingDepths(polygons);
        var result = new List<Loop>(polygons.Count);
        for (var i = 0; i < polygons.Count; i++)
        {
            var depth = depths[i];
            result.Add(new Loop
            {
                Points = Geom.EnsureOrientation(polygons[i], depth % 2 == 0),
                Depth = depth,
                Closed = true,
                PocketDepth = 0,
                Tabs = new List<Tab>(),
                SourceId = sourceIds[i],
            });
        }
        return result;
    }

    /// <summary>Builds loops from open or closed paths for follow-path operations.</summary>
    public static List<Loop> PathsToFollowLoops(IEnumerable<Path> paths, double tolerance)
    {
        var output = new List<Loop>();
        foreach (var path in paths)
        {
            var pts = Geom.DedupePoints(Geom.FlattenPath(path, tolerance));
            if (pts.Count < 2) continue;
            var closed = Geom.IsClosedPath(path);
            if (closed && pts.Count >= 3)
            {
                if (Geom.Dist(pts[0], pts[^1]) < 1e-6) pts.RemoveAt(pts.Count - 1);
                output.Add(new Loop
                {
                    Points = pts,
                    Depth = 0,
                    Closed = true,
                    PocketDepth = 0,
                    Tabs = new List<Tab>(),
                    SourceId = path.Id,
                });
            }
            else
            {
                output.Add(new Loop
                {
                    Points = pts,
                    Depth = 0,
                    Closed = false,
                    PocketDepth = 0,
                    Tabs = new List<Tab>(),
                    SourceId = path.Id,
                });
            }
        }
        return output;
    }

    /// <summary>
    /// Places <paramref name="count"/> drill points evenly along a polyline.
    ///
    /// Closed paths are treated as a loop: the closing edge is included and
    /// the first point is not repeated at the end. Open paths include both
    /// endpoints when more than one hole is requested; a single hole is placed
    /// at the midpoint.
    /// </summary>
    public static List<Vec> DistributeHoles(IReadOnlyList<Vec> points, bool closed, int count)
    {
        var holes = Math.Max(1, count);
        var n = points.Count;
        var result = new List<Vec>();
        if (n == 0) return result;
        if (n == 1)
        {
            result.Add(points[0]);
            return result;
        }

        var segmentCount = closed ? n : n - 1;
        var lengths = new double[segmentCount];
        var total = 0.0;
        for (var i = 0; i < segmentCount; i++)
        {
            var length = Geom.Dist(points[i], points[(i + 1) % n]);
            lengths[i] = length;
            total += length;
        }
        if (!(total > 1e-9))
        {
            result.Add(points[0]);
            return result;
        }

        var fractions = new List<double>(holes);
        if (closed)
        {
            for (var i = 0; i < holes; i++) fractions.Add((double)i / holes);
        }
        else if (holes == 1)
        {
            fractions.Add(0.5);
        }
        else
        {
            for (var i = 0; i < holes; i++) fractions.Add((double)i / (holes - 1));
        }

        foreach (var fraction in fractions)
        {
            var remaining = fraction * total;
            var index = 0;
            while (index < segmentCount - 1 && remaining > lengths[index])
            {
                remaining -= lengths[index];
                index++;
            }
            var a = points[index];
            var b = points[(index + 1) % n];
            var t = lengths[index] > 1e-12
                ? Math.Min(1, Math.Max(0, remaining / lengths[index]))
                : 0;
            result.Add(new Vec(a.X + (b.X - a.X) * t, a.Y + (b.Y - a.Y) * t));
        }
        return result;
    }

    /// <summary>
    /// Offsets a region (a set of nested loops) by <paramref name="delta"/>
    /// millimetres. Positive delta grows the material region, negative shrinks
    /// it. Loops must be supplied with a correct nesting depth.
    /// </summary>
    public static List<Loop> OffsetRegion(IReadOnlyList<Loop> loops, double delta, double arcTolerance = 0.01)
    {
        if (loops.Count == 0) return new List<Loop>();
        var results = new List<List<IntPoint>>();

        foreach (var loop in loops)
        {
            if (loop.Points.Count < 3) continue;
            var cp = ToClipper(loop.Points);
            if (cp.Count < 3) continue;

            // ClipperOffset normalises orientation; work in CCW and flip the
            // sign for holes so the offset always moves "into the material".
            if (ClipperArea(cp) < 0) cp = ClipperReverse(cp);
            var d = (loop.Depth % 2 == 0 ? delta : -delta) * ClipperScale;
            var co = new ClipperOffset(2, Math.Max(0.5, arcTolerance * ClipperScale));
            co.AddPath(cp, JoinType.jtRound, EndType.etClosedPolygon);
            var solution = new List<List<IntPoint>>();
            co.Execute(ref solution, d);
            foreach (var p in solution)
            {
                results.Add(loop.Depth % 2 == 1 ? ClipperReverse(p) : p);
            }
        }

        if (results.Count == 0) return new List<Loop>();

        var clipper = new Clipper();
        clipper.AddPaths(results, PolyType.ptSubject, true);
        var merged = new List<List<IntPoint>>();
        clipper.Execute(ClipType.ctUnion, merged, PolyFillType.pftNonZero, PolyFillType.pftNonZero);

        var polygons = new List<List<Vec>>();
        foreach (var p in merged)
        {
            var pts = FromClipper(p);
            if (pts.Count < 3) continue;
            if (Math.Abs(Geom.PolygonArea(pts)) < MinLoopArea) continue;
            polygons.Add(pts);
        }
        if (polygons.Count == 0) return new List<Loop>();

        var depths = ComputeNestingDepths(polygons);
        var output = new List<Loop>(polygons.Count);
        for (var i = 0; i < polygons.Count; i++)
        {
            output.Add(new Loop
            {
                Points = Geom.EnsureOrientation(polygons[i], depths[i] % 2 == 0),
                Depth = depths[i],
                Closed = true,
                PocketDepth = 0,
                Tabs = new List<Tab>(),
            });
        }
        return output;
    }

    /// <summary>Sets winding according to machining direction, alternating at each nesting level.</summary>
    public static List<Loop> ApplyDirection(IReadOnlyList<Loop> loops, Direction direction) =>
        loops.Select(loop =>
        {
            var wantCcw = loop.Depth % 2 == 0
                ? direction == Direction.CounterClockwise
                : direction == Direction.Clockwise;
            return loop.WithPoints(Geom.EnsureOrientation(loop.Points, wantCcw));
        }).ToList();

    /// <summary>Orders loops outside-in and rotates each start point toward the previous one.</summary>
    public static List<Loop> OrderAndRotateLoops(IReadOnlyList<Loop> loops)
    {
        // OrderBy/ThenBy are stable, matching JavaScript's stable Array.sort.
        var sorted = loops
            .OrderBy(l => l.PocketDepth)
            .ThenBy(l => l.Depth)
            .ThenByDescending(l => Math.Abs(Geom.PolygonArea(l.Points)))
            .ToList();

        Vec? prevStart = null;
        var result = new List<Loop>(sorted.Count);
        foreach (var loop in sorted)
        {
            int index;
            if (prevStart is { } previous)
            {
                index = Geom.NearestPointIndex(loop.Points, previous);
            }
            else
            {
                // Start at the right-most point (ties broken by the higher point).
                index = 0;
                for (var i = 1; i < loop.Points.Count; i++)
                {
                    var p = loop.Points[i];
                    var best = loop.Points[index];
                    if (p.X > best.X + 1e-9 ||
                        (Math.Abs(p.X - best.X) <= 1e-9 && p.Y > best.Y))
                    {
                        index = i;
                    }
                }
            }

            var points = Geom.RotatePointsToStart(loop.Points, index);
            prevStart = points[0];
            result.Add(loop.WithPoints(points));
        }
        return result;
    }

    public static List<Loop> AddTabsToLoops(
        IReadOnlyList<Loop> loops,
        double spacing,
        double width,
        double height)
    {
        if (spacing <= 0 || width <= 0 || height <= 0) return loops.ToList();

        return loops.Select(loop =>
        {
            var len = Geom.PolygonPerimeter(loop.Points);
            if (len <= 0) return loop;
            var tabs = new List<Tab>();
            var count = (int)Math.Floor(len / spacing);
            for (var i = 0; i < count; i++)
            {
                var start = i * spacing;
                if (start + width > len) break;
                tabs.Add(new Tab(start, width, height));
            }
            return new Loop
            {
                Points = loop.Points,
                Depth = loop.Depth,
                Closed = loop.Closed,
                PocketDepth = loop.PocketDepth,
                Tabs = tabs,
                SourceId = loop.SourceId,
            };
        }).ToList();
    }

    /* -------------------------------------------------------------- */
    /* Toolpath generation                                             */
    /* -------------------------------------------------------------- */

    public static GeneratedToolpath GenerateToolpath(
        OperationType type,
        OperationParams opParams,
        IEnumerable<Path> paths,
        double tolerance)
    {
        var warnings = new List<string>();
        var radius = opParams.ToolDiameter / 2;
        var selected = paths.ToList();

        switch (type)
        {
            case OperationType.Profile:
            {
                var input = PathsToLoops(selected, tolerance);
                if (input.Count == 0)
                {
                    return new GeneratedToolpath
                    {
                        Warnings = { "Select at least one closed path." },
                    };
                }

                var result = OffsetRegion(input, opParams.Outside ? radius : -radius);
                if (result.Count == 0)
                {
                    warnings.Add(opParams.Outside
                        ? "The offset produced no toolpath."
                        : "Tool diameter is too large for the selected path.");
                }

                result = ApplyDirection(result, opParams.Direction);
                if (opParams.TabSpacing > 0 && opParams.TabWidth > 0 && opParams.TabHeight > 0)
                {
                    result = AddTabsToLoops(result, opParams.TabSpacing, opParams.TabWidth, opParams.TabHeight);
                }

                return new GeneratedToolpath
                {
                    Loops = OrderAndRotateLoops(result),
                    Warnings = warnings,
                };
            }

            case OperationType.Pocket:
            {
                var input = PathsToLoops(selected, tolerance);
                if (input.Count == 0)
                {
                    return new GeneratedToolpath
                    {
                        Warnings = { "Select at least one closed path." },
                    };
                }

                var stepoverDist = Math.Max(0.01, opParams.Stepover * opParams.ToolDiameter);
                var current = OffsetRegion(input, -(radius + opParams.RoughingClearance));
                if (current.Count == 0)
                {
                    return new GeneratedToolpath
                    {
                        Warnings = { "Tool diameter and clearance are too large for the selected path." },
                    };
                }

                var all = new List<Loop>();
                var level = 0;
                while (current.Count > 0 && level < 2000)
                {
                    var levelLoops = ApplyDirection(current, opParams.Direction);
                    foreach (var loop in levelLoops)
                    {
                        all.Add(new Loop
                        {
                            Points = loop.Points,
                            Depth = loop.Depth,
                            Closed = loop.Closed,
                            PocketDepth = level,
                            Tabs = loop.Tabs,
                            SourceId = loop.SourceId,
                        });
                    }
                    level++;
                    current = OffsetRegion(current, -stepoverDist);
                }

                return new GeneratedToolpath
                {
                    Loops = OrderAndRotateLoops(all),
                    Warnings = warnings,
                };
            }

            case OperationType.Follow:
            {
                var loops = PathsToFollowLoops(selected, tolerance);
                if (loops.Count == 0)
                {
                    return new GeneratedToolpath
                    {
                        Warnings = { "Select at least one path." },
                    };
                }
                return new GeneratedToolpath
                {
                    Loops = loops.Select(l => new Loop
                    {
                        Points = l.Points,
                        Depth = l.Depth,
                        Closed = l.Closed,
                        PocketDepth = 0,
                        Tabs = l.Tabs,
                        SourceId = l.SourceId,
                    }).ToList(),
                    Warnings = warnings,
                };
            }

            case OperationType.DrillPath:
            {
                var followLoops = PathsToFollowLoops(selected, tolerance);
                if (followLoops.Count == 0)
                {
                    return new GeneratedToolpath
                    {
                        Warnings = { "Select at least one path." },
                    };
                }

                var points = new List<Vec>();
                foreach (var loop in followLoops)
                {
                    points.AddRange(DistributeHoles(loop.Points, loop.Closed, opParams.HoleCount));
                }
                return new GeneratedToolpath { DrillPoints = points, Warnings = warnings };
            }

            default: // drill
            {
                var loops = PathsToLoops(selected, tolerance);
                if (loops.Count == 0)
                {
                    return new GeneratedToolpath
                    {
                        Warnings = { "Select at least one closed path." },
                    };
                }

                var points = new List<Vec>();
                if (opParams.Center || opParams.Spacing == 0)
                {
                    foreach (var loop in loops)
                    {
                        var b = Geom.PolygonBounds(loop.Points);
                        points.Add(new Vec((b.MinX + b.MaxX) / 2, (b.MinY + b.MaxY) / 2));
                    }
                }
                else
                {
                    var spacing = Math.Abs(opParams.Spacing);
                    foreach (var loop in loops)
                    {
                        var b = Geom.PolygonBounds(loop.Points);
                        for (var i = 1.0; i < b.MaxX - b.MinX; i += spacing)
                        {
                            for (var j = 1.0; j < b.MaxY - b.MinY; j += spacing)
                            {
                                var p = new Vec(b.MinX + i, b.MinY + j);
                                if (Geom.PointInPolygon(loop.Points, p, false)) points.Add(p);
                            }
                        }
                    }
                    if (points.Count == 0) warnings.Add("The fill pattern produced no drill points.");
                }

                return new GeneratedToolpath { DrillPoints = points, Warnings = warnings };
            }
        }
    }

    /* -------------------------------------------------------------- */
    /* Nesting                                                         */
    /* -------------------------------------------------------------- */

    private static double PolygonInsideArea(IReadOnlyList<Vec> inner, IReadOnlyList<Vec> outer) =>
        ClipperIntersectionArea(inner, outer);

    private static List<Vec> RotatePoints(IReadOnlyList<Vec> points, double angle)
    {
        var c = Math.Cos(angle);
        var s = Math.Sin(angle);
        return points.Select(p => new Vec(c * p.X - s * p.Y, s * p.X + c * p.Y)).ToList();
    }

    private static List<Vec> TranslatePoints(IReadOnlyList<Vec> points, double x, double y) =>
        points.Select(p => new Vec(p.X + x, p.Y + y)).ToList();

    private static double AreaOf(IReadOnlyList<Vec> points) => Math.Abs(Geom.PolygonArea(points));

    /// <summary>
    /// Bottom-left nest packer. Objects are placed one at a time at the first
    /// non-overlapping position inside the boundary, trying each rotation.
    /// </summary>
    public static List<NestPlacement> NestItems(
        IReadOnlyList<Vec> boundary,
        IReadOnlyList<NestItem> items,
        NestOptions options)
    {
        var placements = new List<NestPlacement>();
        var occupied = new List<List<Vec>>();
        var bnd = Geom.PolygonBounds(boundary);
        var step = Math.Max(options.Step, 0.25);

        var order = items
            .Select((item, index) => (Index: index, Area: AreaOf(item.Outline)))
            .OrderByDescending(x => x.Area)
            .ToList();

        foreach (var (index, _) in order)
        {
            var item = items[index];
            (Vec Pos, double Rot)? best = null;

            foreach (var rot in options.Rotations)
            {
                var rotated = RotatePoints(item.Outline, rot);
                var rb = Geom.PolygonBounds(rotated);
                var w = rb.MaxX - rb.MinX;
                var h = rb.MaxY - rb.MinY;
                if (w > bnd.MaxX - bnd.MinX || h > bnd.MaxY - bnd.MinY) continue;

                // Scan bottom-left first. A coarse scan keeps this interactive.
                for (var y = bnd.MinY; y + h <= bnd.MaxY + 1e-6; y += step)
                {
                    for (var x = bnd.MinX; x + w <= bnd.MaxX + 1e-6; x += step)
                    {
                        var placed = TranslatePoints(rotated, x - rb.MinX, y - rb.MinY);
                        // Entirely inside the boundary?
                        if (PolygonInsideArea(placed, boundary) < AreaOf(placed) - 1e-3) continue;
                        // No overlap with previously placed objects?
                        var overlaps = occupied.Any(occ =>
                            ClipperIntersectionArea(placed, occ) > 1e-3);
                        if (overlaps) continue;
                        // Bottom-left placement: the first fit is good enough.
                        best ??= (new Vec(x - rb.MinX, y - rb.MinY), rot);
                        break;
                    }
                    if (best is not null) break;
                }
                if (best is not null) break;
            }

            if (best is { } placement)
            {
                var rotated = RotatePoints(item.Outline, placement.Rot);
                occupied.Add(TranslatePoints(rotated, placement.Pos.X, placement.Pos.Y));
                placements.Add(new NestPlacement(index, placement.Pos, placement.Rot));
            }
        }

        return placements;
    }

    /// <summary>Buffers a loop outward by <paramref name="distance"/> for nesting collision shapes.</summary>
    public static List<Vec> BufferLoop(Loop loop, double distance)
    {
        var source = new Loop
        {
            Points = loop.Points,
            Depth = 0,
            Closed = loop.Closed,
            PocketDepth = loop.PocketDepth,
            Tabs = loop.Tabs,
            SourceId = loop.SourceId,
        };
        var result = OffsetRegion(new[] { source }, distance);
        if (result.Count == 0) return loop.Points;

        // Union all result loops into one outline approximation by taking the
        // top-level (non-hole) loops. For collision purposes this is sufficient.
        return result.Where(l => l.Depth % 2 == 0).SelectMany(l => l.Points).ToList();
    }

    public static Bounds? ToolpathBounds(IReadOnlyList<Loop> loops, IReadOnlyList<Vec> drillPoints)
    {
        Bounds? b = null;
        foreach (var loop in loops)
        {
            var lb = Geom.PolygonBounds(loop.Points);
            b = b is { } current
                ? new Bounds(
                    Math.Min(current.MinX, lb.MinX),
                    Math.Min(current.MinY, lb.MinY),
                    Math.Max(current.MaxX, lb.MaxX),
                    Math.Max(current.MaxY, lb.MaxY))
                : lb;
        }
        foreach (var p in drillPoints)
        {
            b = b is { } current
                ? new Bounds(
                    Math.Min(current.MinX, p.X),
                    Math.Min(current.MinY, p.Y),
                    Math.Max(current.MaxX, p.X),
                    Math.Max(current.MaxY, p.Y))
                : new Bounds(p.X, p.Y, p.X, p.Y);
        }
        return b;
    }

    /// <summary>Distance from a point to a toolpath (used for hit-testing rendered toolpaths).</summary>
    public static double DistanceToLoops(Vec p, IReadOnlyList<Loop> loops)
    {
        var best = double.PositiveInfinity;
        foreach (var loop in loops)
        {
            var n = loop.Points.Count;
            for (var i = 0; i < n; i++)
            {
                if (!loop.Closed && i == n - 1) break;
                var a = loop.Points[i];
                var b = loop.Points[(i + 1) % n];
                best = Math.Min(best, Geom.DistancePointToSegment(p, a, b));
            }
        }
        return best;
    }

    /// <summary>Reverses a loop (used when flipping cut direction after tabs are added).</summary>
    public static Loop ReverseLoop(Loop loop) => loop.WithPoints(loop.Points.AsEnumerable().Reverse().ToList());
}
