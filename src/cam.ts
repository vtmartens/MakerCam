/**
 * CAM engine: turns drawing paths into toolpaths.
 *
 * The original PartKam offset algorithm depended on the Flash rasterizer to
 * discard invalid offset loops. This port uses Clipper's polygon offsetting
 * instead, which gives the same result (round cutter compensation) without a
 * raster round-trip.
 */

import ClipperLib from 'clipper-lib';
import {
  Bounds,
  Path,
  Vec,
  closedPolygon,
  dedupePoints,
  distancePointToSegment,
  dist,
  ensureOrientation,
  flattenPath,
  isClosedPath,
  nearestPointIndex,
  pointInPolygon,
  polygonArea,
  polygonBounds,
  polygonPerimeter,
  rotatePointsToStart,
} from './geom';

export type Unit = 'mm' | 'in';
export type Direction = 1 | 2; // 1 = counter-clockwise, 2 = clockwise
export type OperationType = 'profile' | 'pocket' | 'follow' | 'drill' | 'drillpath';

export interface Tab {
  /** Distance along the loop at which the tab begins. */
  start: number;
  /** Tab width along the loop. */
  width: number;
  /** Height of the tab above the target depth. */
  height: number;
}

export interface Loop {
  points: Vec[];
  depth: number;
  closed: boolean;
  /** Pocket depth level (0 = first, boundary-level pass). */
  pocketDepth: number;
  tabs: Tab[];
  sourceId?: string;
}

export interface OperationParams {
  toolDiameter: number; // mm
  targetDepth: number; // mm (negative)
  safetyHeight: number; // mm (positive)
  stockSurface: number; // mm (0 normally)
  stepdown: number; // mm (positive)
  feedrate: number; // mm/min
  plungerate: number; // mm/min
  outside: boolean; // profile only
  direction: Direction;
  stepover: number; // fraction of tool diameter (pocket only), 0..1
  roughingClearance: number; // mm (pocket only)
  center: boolean; // drill only
  spacing: number; // mm (drill only)
  holeCount: number; // holes per path (drillpath only)
  tabSpacing: number; // mm
  tabWidth: number; // mm
  tabHeight: number; // mm
}

export interface Operation {
  id: string;
  type: OperationType;
  name: string;
  params: OperationParams;
  pathIds: string[];
  loops: Loop[];
  drillPoints: Vec[];
  processed: boolean;
  visible: boolean;
}

export interface OpDefinition {
  id?: string;
  type: OperationType;
  name: string;
  params: OperationParams;
  pathIds: string[];
}

export const DEFAULT_PARAMS = (unit: Unit): OperationParams => {
  // Values are always stored in millimetres, but the defaults mirror the
  // original MakerCam defaults for the active display unit.
  const inch = unit === 'in';
  return {
    toolDiameter: inch ? 0.25 * 25.4 : 6.35,
    targetDepth: inch ? -0.75 * 25.4 : -12,
    safetyHeight: inch ? 0.5 * 25.4 : 12,
    stockSurface: 0,
    stepdown: inch ? 0.05 * 25.4 : 2,
    feedrate: inch ? 60 * 25.4 : 800,
    plungerate: inch ? 30 * 25.4 : 300,
    outside: true,
    direction: 1,
    stepover: 0.4,
    roughingClearance: 0,
    center: true,
    spacing: inch ? 0.5 * 25.4 : 12.7,
    holeCount: 4,
    tabSpacing: inch ? 5 * 25.4 : 60,
    tabWidth: inch ? 0.25 * 25.4 : 6,
    tabHeight: inch ? 0.25 * 25.4 : 3,
  };
};

const CLIPPER_SCALE = 1000; // 1 unit = 0.001 mm
const MIN_LOOP_AREA = 1e-5; // mm^2

function toClipper(points: Vec[]): { X: number; Y: number }[] {
  return points.map((p) => ({ X: Math.round(p.x * CLIPPER_SCALE), Y: Math.round(p.y * CLIPPER_SCALE) }));
}

function fromClipper(path: { X: number; Y: number }[]): Vec[] {
  return dedupePoints(path.map((p) => ({ x: p.X / CLIPPER_SCALE, y: p.Y / CLIPPER_SCALE })), 1e-6);
}

function clipperArea(path: { X: number; Y: number }[]): number {
  return ClipperLib.Clipper.Area(path) / (CLIPPER_SCALE * CLIPPER_SCALE);
}

function clipperReverse(path: { X: number; Y: number }[]): { X: number; Y: number }[] {
  return path.slice().reverse();
}

/**
 * Finds a point strictly inside a simple polygon. Used for containment tests;
 * a vertex or the centroid can fall outside concave shapes.
 */
export function interiorPoint(points: Vec[]): Vec {
  if (points.length < 3) return points[0] ?? { x: 0, y: 0 };
  const b = polygonBounds(points);
  const height = b.maxY - b.minY;
  const yCandidates = [b.minY + height * 0.5, b.minY + height * 0.37, b.minY + height * 0.61];
  for (const yBase of yCandidates) {
    // Avoid scanning exactly through vertices.
    const y = yBase + height * 1e-4;
    const xs: number[] = [];
    for (let i = 0; i < points.length; i++) {
      const a = points[i];
      const c = points[(i + 1) % points.length];
      if ((a.y > y) !== (c.y > y)) {
        xs.push(a.x + ((y - a.y) * (c.x - a.x)) / (c.y - a.y));
      }
    }
    xs.sort((p, q) => p - q);
    for (let i = 0; i + 1 < xs.length; i += 2) {
      const p = { x: (xs[i] + xs[i + 1]) / 2, y };
      if (pointInPolygon(points, p, false)) return p;
    }
  }
  const c = points.reduce((acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }), { x: 0, y: 0 });
  return { x: c.x / points.length, y: c.y / points.length };
}

function clipperIntersectionArea(a: Vec[], b: Vec[]): number {
  const clipper = new ClipperLib.Clipper();
  clipper.AddPath(toClipper(a), ClipperLib.PolyType.ptSubject, true);
  clipper.AddPath(toClipper(b), ClipperLib.PolyType.ptClip, true);
  const solution = new ClipperLib.Paths();
  clipper.Execute(
    ClipperLib.ClipType.ctIntersection,
    solution,
    ClipperLib.PolyFillType.pftNonZero,
    ClipperLib.PolyFillType.pftNonZero,
  );
  let area = 0;
  for (const p of solution) area += Math.abs(clipperArea(p));
  return area;
}

/** True when `inner` lies entirely inside `outer` (touching is allowed). */
function loopContains(outer: Vec[], inner: Vec[]): boolean {
  const ob = polygonBounds(outer);
  const ib = polygonBounds(inner);
  const eps = 1e-6;
  if (
    ib.minX < ob.minX - eps ||
    ib.minY < ob.minY - eps ||
    ib.maxX > ob.maxX + eps ||
    ib.maxY > ob.maxY + eps
  ) {
    return false;
  }
  const p = interiorPoint(inner);
  if (!pointInPolygon(outer, p, false)) return false;
  const innerArea = Math.abs(polygonArea(inner));
  const inter = clipperIntersectionArea(inner, outer);
  return inter >= innerArea - Math.max(1e-6, innerArea * 1e-6);
}

/**
 * Nesting depth of each loop: 0 = outer, 1 = hole, 2 = island, etc.
 * Uses full containment (not just a vertex test), so partially overlapping
 * paths are both treated as outer boundaries and later unioned by the offset.
 */
export function computeNestingDepths(loops: Vec[][]): number[] {
  const bounds = loops.map((p) => polygonBounds(p));
  const points = loops.map((p) => interiorPoint(p));
  return loops.map((_, j) => {
    let depth = 0;
    for (let i = 0; i < loops.length; i++) {
      if (i === j) continue;
      const bi = bounds[i];
      const bj = bounds[j];
      if (
        bj.minX < bi.minX - 1e-6 ||
        bj.minY < bi.minY - 1e-6 ||
        bj.maxX > bi.maxX + 1e-6 ||
        bj.maxY > bi.maxY + 1e-6
      ) {
        continue;
      }
      if (!pointInPolygon(loops[i], points[j], false)) continue;
      if (loopContains(loops[i], loops[j])) depth++;
    }
    return depth;
  });
}

/**
 * Resolves self-intersections in a single path by running it through Clipper
 * with an even-odd fill. A bow-tie, for example, becomes two simple loops.
 */
function simplifyPolygon(points: Vec[]): Vec[][] {
  const clipper = new ClipperLib.Clipper();
  clipper.AddPath(toClipper(points), ClipperLib.PolyType.ptSubject, true);
  const solution = new ClipperLib.Paths();
  clipper.Execute(
    ClipperLib.ClipType.ctUnion,
    solution,
    ClipperLib.PolyFillType.pftEvenOdd,
    ClipperLib.PolyFillType.pftEvenOdd,
  );
  const result: Vec[][] = [];
  for (const p of solution) {
    const pts = fromClipper(p);
    if (pts.length >= 3 && Math.abs(polygonArea(pts)) >= MIN_LOOP_AREA) result.push(pts);
  }
  return result;
}

/** Builds oriented, nested loops from closed drawing paths. */
export function pathsToLoops(paths: Path[], tolerance: number): Loop[] {
  const polygons: Vec[][] = [];
  const sourceIds: (string | undefined)[] = [];
  for (const path of paths) {
    if (!isClosedPath(path)) continue;
    const pts = dedupePoints(closedPolygon(path, tolerance));
    if (pts.length < 3) continue;
    let loops: Vec[][] = [];
    if (Math.abs(polygonArea(pts)) < MIN_LOOP_AREA) {
      loops = simplifyPolygon(pts);
    } else {
      loops = simplifyPolygon(pts);
      if (loops.length === 0) loops = [pts];
    }
    for (const loop of loops) {
      polygons.push(loop);
      sourceIds.push(path.id);
    }
  }
  if (polygons.length === 0) return [];
  const depths = computeNestingDepths(polygons);
  return polygons.map((pts, i) => {
    const depth = depths[i];
    return {
      points: ensureOrientation(pts, depth % 2 === 0),
      depth,
      closed: true,
      pocketDepth: 0,
      tabs: [],
      sourceId: sourceIds[i],
    };
  });
}

/** Builds loops from open or closed paths for follow-path operations. */
export function pathsToFollowLoops(paths: Path[], tolerance: number): Loop[] {
  const out: Loop[] = [];
  for (const path of paths) {
    let pts = dedupePoints(flattenPath(path, tolerance));
    if (pts.length < 2) continue;
    const closed = isClosedPath(path);
    if (closed && pts.length >= 3) {
      if (dist(pts[0], pts[pts.length - 1]) < 1e-6) pts = pts.slice(0, -1);
      out.push({ points: pts, depth: 0, closed: true, pocketDepth: 0, tabs: [], sourceId: path.id });
    } else {
      out.push({ points: pts, depth: 0, closed: false, pocketDepth: 0, tabs: [], sourceId: path.id });
    }
  }
  return out;
}

/**
 * Places `count` drill points evenly along a polyline.
 *
 * Closed paths are treated as a loop: the closing edge is included and the
 * first point is not repeated at the end. Open paths include both endpoints
 * when more than one hole is requested; a single hole is placed at the
 * midpoint.
 */
export function distributeHoles(points: Vec[], closed: boolean, count: number): Vec[] {
  const n = points.length;
  const holes = Math.max(1, Math.floor(count));
  if (n === 0) return [];
  if (n === 1) return [{ ...points[0] }];

  const segmentCount = closed ? n : n - 1;
  const lengths: number[] = [];
  let total = 0;
  for (let i = 0; i < segmentCount; i++) {
    const l = dist(points[i], points[(i + 1) % n]);
    lengths.push(l);
    total += l;
  }
  if (!(total > 1e-9)) return [{ ...points[0] }];

  const fractions: number[] = [];
  if (closed) {
    for (let i = 0; i < holes; i++) fractions.push(i / holes);
  } else if (holes === 1) {
    fractions.push(0.5);
  } else {
    for (let i = 0; i < holes; i++) fractions.push(i / (holes - 1));
  }

  const result: Vec[] = [];
  for (const fraction of fractions) {
    let remaining = fraction * total;
    let index = 0;
    while (index < segmentCount - 1 && remaining > lengths[index]) {
      remaining -= lengths[index];
      index++;
    }
    const a = points[index];
    const b = points[(index + 1) % n];
    const t = lengths[index] > 1e-12 ? Math.min(1, Math.max(0, remaining / lengths[index])) : 0;
    result.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
  }
  return result;
}

/**
 * Offsets a region (a set of nested loops) by `delta` millimetres.
 * Positive delta grows the material region, negative shrinks it.
 * Loops must be supplied with a correct nesting depth.
 */
export function offsetRegion(loops: Loop[], delta: number, arcTolerance = 0.01): Loop[] {
  if (loops.length === 0) return [];
  const results: { X: number; Y: number }[][] = [];
  for (const loop of loops) {
    if (loop.points.length < 3) continue;
    let cp = toClipper(loop.points);
    if (cp.length < 3) continue;
    // ClipperOffset normalises orientation; work in CCW and flip the sign for
    // holes so that the offset always moves "into the material".
    if (clipperArea(cp) < 0) cp = clipperReverse(cp);
    const d = (loop.depth % 2 === 0 ? delta : -delta) * CLIPPER_SCALE;
    const co = new ClipperLib.ClipperOffset(2, Math.max(0.5, arcTolerance * CLIPPER_SCALE));
    co.AddPath(cp, ClipperLib.JoinType.jtRound, ClipperLib.EndType.etClosedPolygon);
    const solution = new ClipperLib.Paths();
    co.Execute(solution, d);
    for (const p of solution) {
      if (loop.depth % 2 === 1) results.push(clipperReverse(p));
      else results.push(p);
    }
  }
  if (results.length === 0) return [];

  const clipper = new ClipperLib.Clipper();
  clipper.AddPaths(results, ClipperLib.PolyType.ptSubject, true);
  const merged = new ClipperLib.Paths();
  clipper.Execute(
    ClipperLib.ClipType.ctUnion,
    merged,
    ClipperLib.PolyFillType.pftNonZero,
    ClipperLib.PolyFillType.pftNonZero,
  );

  const polygons: Vec[][] = [];
  for (const p of merged) {
    const pts = fromClipper(p);
    if (pts.length < 3) continue;
    if (Math.abs(polygonArea(pts)) < MIN_LOOP_AREA) continue;
    polygons.push(pts);
  }
  if (polygons.length === 0) return [];
  const depths = computeNestingDepths(polygons);
  return polygons.map((pts, i) => ({
    points: ensureOrientation(pts, depths[i] % 2 === 0),
    depth: depths[i],
    closed: true,
    pocketDepth: 0,
    tabs: [],
  }));
}

/** Sets winding according to machining direction, alternating at each nesting level. */
export function applyDirection(loops: Loop[], direction: Direction): Loop[] {
  return loops.map((loop) => {
    const wantCcw = loop.depth % 2 === 0 ? direction === 1 : direction === 2;
    return { ...loop, points: ensureOrientation(loop.points, wantCcw) };
  });
}

/** Orders loops outside-in and rotates each start point toward the previous one. */
export function orderAndRotateLoops(loops: Loop[]): Loop[] {
  const sorted = loops.slice().sort((a, b) => {
    if (a.pocketDepth !== b.pocketDepth) return a.pocketDepth - b.pocketDepth;
    if (a.depth !== b.depth) return a.depth - b.depth;
    return Math.abs(polygonArea(b.points)) - Math.abs(polygonArea(a.points));
  });
  let prevStart: Vec | null = null;
  return sorted.map((loop) => {
    let index: number;
    if (prevStart) {
      index = nearestPointIndex(loop.points, prevStart);
    } else {
      // Start at the right-most point (ties broken by the higher point).
      index = 0;
      for (let i = 1; i < loop.points.length; i++) {
        const p = loop.points[i];
        const best = loop.points[index];
        if (p.x > best.x + 1e-9 || (Math.abs(p.x - best.x) <= 1e-9 && p.y > best.y)) index = i;
      }
    }
    const points = rotatePointsToStart(loop.points, index);
    prevStart = points[0];
    return { ...loop, points };
  });
}

export function addTabsToLoops(loops: Loop[], spacing: number, width: number, height: number): Loop[] {
  if (spacing <= 0 || width <= 0 || height <= 0) return loops;
  return loops.map((loop) => {
    const len = polygonPerimeter(loop.points);
    if (len <= 0) return loop;
    const tabs: Tab[] = [];
    const count = Math.floor(len / spacing);
    for (let i = 0; i < count; i++) {
      const start = i * spacing;
      if (start + width > len) break;
      tabs.push({ start, width, height });
    }
    return { ...loop, tabs };
  });
}

export interface GeneratedToolpath {
  loops: Loop[];
  drillPoints: Vec[];
  warnings: string[];
}

export function generateToolpath(
  type: OperationType,
  params: OperationParams,
  paths: Path[],
  tolerance: number,
): GeneratedToolpath {
  const warnings: string[] = [];
  const radius = params.toolDiameter / 2;
  const selected = paths;

  if (type === 'profile') {
    const input = pathsToLoops(selected, tolerance);
    if (input.length === 0) {
      return { loops: [], drillPoints: [], warnings: ['Select at least one closed path.'] };
    }
    let result = offsetRegion(input, params.outside ? radius : -radius);
    if (result.length === 0) {
      warnings.push(
        params.outside
          ? 'The offset produced no toolpath.'
          : 'Tool diameter is too large for the selected path.',
      );
    }
    result = applyDirection(result, params.direction);
    if (params.tabSpacing > 0 && params.tabWidth > 0 && params.tabHeight > 0) {
      result = addTabsToLoops(result, params.tabSpacing, params.tabWidth, params.tabHeight);
    }
    return { loops: orderAndRotateLoops(result), drillPoints: [], warnings };
  }

  if (type === 'pocket') {
    const input = pathsToLoops(selected, tolerance);
    if (input.length === 0) {
      return { loops: [], drillPoints: [], warnings: ['Select at least one closed path.'] };
    }
    const stepoverDist = Math.max(0.01, params.stepover * params.toolDiameter);
    let current = offsetRegion(input, -(radius + params.roughingClearance));
    if (current.length === 0) {
      return {
        loops: [],
        drillPoints: [],
        warnings: ['Tool diameter and clearance are too large for the selected path.'],
      };
    }
    const all: Loop[] = [];
    let level = 0;
    while (current.length > 0 && level < 2000) {
      const levelLoops = applyDirection(current, params.direction).map((l) => ({
        ...l,
        pocketDepth: level,
      }));
      all.push(...levelLoops);
      level++;
      current = offsetRegion(current, -stepoverDist);
    }
    return { loops: orderAndRotateLoops(all), drillPoints: [], warnings };
  }

  if (type === 'follow') {
    const loops = pathsToFollowLoops(selected, tolerance);
    if (loops.length === 0) {
      return { loops: [], drillPoints: [], warnings: ['Select at least one path.'] };
    }
    return { loops: loops.map((l) => ({ ...l, pocketDepth: 0 })), drillPoints: [], warnings };
  }

  if (type === 'drillpath') {
    const followLoops = pathsToFollowLoops(selected, tolerance);
    if (followLoops.length === 0) {
      return { loops: [], drillPoints: [], warnings: ['Select at least one path.'] };
    }
    const points: Vec[] = [];
    for (const loop of followLoops) {
      points.push(...distributeHoles(loop.points, loop.closed, params.holeCount));
    }
    return { loops: [], drillPoints: points, warnings };
  }

  // drill
  const loops = pathsToLoops(selected, tolerance);
  if (loops.length === 0) {
    return { loops: [], drillPoints: [], warnings: ['Select at least one closed path.'] };
  }
  const points: Vec[] = [];
  if (params.center || params.spacing === 0) {
    for (const loop of loops) {
      const b = polygonBounds(loop.points);
      points.push({ x: (b.minX + b.maxX) / 2, y: (b.minY + b.maxY) / 2 });
    }
  } else {
    const spacing = Math.abs(params.spacing);
    for (const loop of loops) {
      const b = polygonBounds(loop.points);
      for (let i = 1; i < b.maxX - b.minX; i += spacing) {
        for (let j = 1; j < b.maxY - b.minY; j += spacing) {
          const p = { x: b.minX + i, y: b.minY + j };
          if (pointInPolygon(loop.points, p, false)) points.push(p);
        }
      }
    }
    if (points.length === 0) warnings.push('The fill pattern produced no drill points.');
  }
  return { loops: [], drillPoints: points, warnings };
}

/* ------------------------------------------------------------------ */
/* Nesting                                                             */
/* ------------------------------------------------------------------ */

export interface NestOptions {
  gap: number; // mm between objects
  rotations: number[]; // radians
  step: number; // placement scan step in mm
}

export interface NestItem {
  /** Convex-ish outline of the occupied area, already buffered by gap/2. */
  outline: Vec[];
  /** Original toolpath loops, kept for rendering/regeneration. */
  sourceLoops: Loop[];
}

export interface NestPlacement {
  index: number;
  position: Vec;
  rotation: number;
}

function polygonIntersectionArea(a: Vec[], b: Vec[]): number {
  const clipper = new ClipperLib.Clipper();
  clipper.AddPath(toClipper(a), ClipperLib.PolyType.ptSubject, true);
  clipper.AddPath(toClipper(b), ClipperLib.PolyType.ptClip, true);
  const solution = new ClipperLib.Paths();
  clipper.Execute(
    ClipperLib.ClipType.ctIntersection,
    solution,
    ClipperLib.PolyFillType.pftNonZero,
    ClipperLib.PolyFillType.pftNonZero,
  );
  let area = 0;
  for (const p of solution) area += Math.abs(clipperArea(p));
  return area;
}

function polygonInsideArea(inner: Vec[], outer: Vec[]): number {
  const clipper = new ClipperLib.Clipper();
  clipper.AddPath(toClipper(inner), ClipperLib.PolyType.ptSubject, true);
  clipper.AddPath(toClipper(outer), ClipperLib.PolyType.ptClip, true);
  const solution = new ClipperLib.Paths();
  clipper.Execute(
    ClipperLib.ClipType.ctIntersection,
    solution,
    ClipperLib.PolyFillType.pftNonZero,
    ClipperLib.PolyFillType.pftNonZero,
  );
  let area = 0;
  for (const p of solution) area += Math.abs(clipperArea(p));
  return area;
}

function rotatePoints(points: Vec[], angle: number): Vec[] {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return points.map((p) => ({ x: c * p.x - s * p.y, y: s * p.x + c * p.y }));
}

function translatePoints(points: Vec[], x: number, y: number): Vec[] {
  return points.map((p) => ({ x: p.x + x, y: p.y + y }));
}

function areaOf(points: Vec[]): number {
  return Math.abs(polygonArea(points));
}

/**
 * Bottom-left nest packer. Objects are placed one at a time at the first
 * non-overlapping position inside the boundary, trying each rotation.
 */
export function nestItems(boundary: Vec[], items: NestItem[], options: NestOptions): NestPlacement[] {
  const placements: NestPlacement[] = [];
  const occupied: Vec[][] = [];
  const bnd = polygonBounds(boundary);
  const boundaryArea = areaOf(boundary);
  const step = Math.max(options.step, 0.25);

  const order = items
    .map((item, index) => ({ index, area: areaOf(item.outline) }))
    .sort((a, b) => b.area - a.area);

  for (const { index } of order) {
    const item = items[index];
    let best: { pos: Vec; rot: number; score: number } | null = null;

    for (const rot of options.rotations) {
      const rotated = rotatePoints(item.outline, rot);
      const rb = polygonBounds(rotated);
      const w = rb.maxX - rb.minX;
      const h = rb.maxY - rb.minY;
      if (w > bnd.maxX - bnd.minX || h > bnd.maxY - bnd.minY) continue;

      // Scan bottom-left first. A coarse scan keeps this interactive.
      for (let y = bnd.minY; y + h <= bnd.maxY + 1e-6; y += step) {
        for (let x = bnd.minX; x + w <= bnd.maxX + 1e-6; x += step) {
          const placed = translatePoints(rotated, x - rb.minX, y - rb.minY);
          // Entirely inside the boundary?
          if (polygonInsideArea(placed, boundary) < areaOf(placed) - 1e-3) continue;
          // No overlap with previously placed objects?
          let overlaps = false;
          for (const occ of occupied) {
            if (polygonIntersectionArea(placed, occ) > 1e-3) {
              overlaps = true;
              break;
            }
          }
          if (overlaps) continue;
          // Bottom-left placement: the first fit is good enough.
          if (!best) best = { pos: { x: x - rb.minX, y: y - rb.minY }, rot, score: 0 };
          break;
        }
        if (best) break;
      }
      if (best) break;
    }

    if (best) {
      const rotated = rotatePoints(item.outline, best.rot);
      const placed = translatePoints(rotated, best.pos.x, best.pos.y);
      occupied.push(placed);
      placements.push({ index, position: best.pos, rotation: best.rot });
    }
  }

  // Utilisation sanity check; not fatal.
  const used = occupied.reduce((s, p) => s + areaOf(p), 0);
  if (boundaryArea > 0 && used / boundaryArea > 1.01) {
    // overlapping placements would only happen if the scan failed; keep going
  }
  return placements;
}

/** Buffers a loop outward by `distance` for nesting collision shapes. */
export function bufferLoop(loop: Loop, distance: number): Vec[] {
  const result = offsetRegion([{ ...loop, depth: 0 }], distance);
  if (result.length === 0) return loop.points;
  // Union all result loops into one outline approximation by taking the
  // top-level (non-hole) loops. For collision purposes this is sufficient.
  return result.filter((l) => l.depth % 2 === 0).flatMap((l) => l.points);
}

export function toolpathBounds(loops: Loop[], drillPoints: Vec[]): Bounds | null {
  let b: Bounds | null = null;
  for (const l of loops) {
    const lb = polygonBounds(l.points);
    b = b
      ? {
          minX: Math.min(b.minX, lb.minX),
          minY: Math.min(b.minY, lb.minY),
          maxX: Math.max(b.maxX, lb.maxX),
          maxY: Math.max(b.maxY, lb.maxY),
        }
      : lb;
  }
  for (const p of drillPoints) {
    b = b
      ? {
          minX: Math.min(b.minX, p.x),
          minY: Math.min(b.minY, p.y),
          maxX: Math.max(b.maxX, p.x),
          maxY: Math.max(b.maxY, p.y),
        }
      : { minX: p.x, minY: p.y, maxX: p.x, maxY: p.y };
  }
  return b;
}

/** Distance from a point to a toolpath (for hit-testing rendered toolpaths). */
export function distanceToLoops(p: Vec, loops: Loop[], closed = true): number {
  let best = Infinity;
  for (const loop of loops) {
    for (let i = 0; i < loop.points.length; i++) {
      const a = loop.points[i];
      const b = loop.points[(i + 1) % loop.points.length];
      if (!loop.closed && i === loop.points.length - 1) break;
      best = Math.min(best, distancePointToSegment(p, a, b));
    }
  }
  return best;
}

/** Reverses a loop (used when flipping cut direction after tabs are added). */
export function reverseLoop(loop: Loop): Loop {
  return { ...loop, points: loop.points.slice().reverse() };
}
