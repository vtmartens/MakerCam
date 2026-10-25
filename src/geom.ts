/**
 * Geometry primitives for the MakerCam port.
 *
 * All model coordinates are millimetres with the Y axis pointing up
 * (Cartesian / machining convention). SVG input is Y-down and is flipped
 * during import.
 */

export interface Vec {
  x: number;
  y: number;
}

export type SegmentKind = 'line' | 'quad' | 'cubic';

export interface LineSegment {
  kind: 'line';
  p1: Vec;
  p2: Vec;
}

export interface QuadSegment {
  kind: 'quad';
  p1: Vec;
  c: Vec;
  p2: Vec;
}

export interface CubicSegment {
  kind: 'cubic';
  p1: Vec;
  c1: Vec;
  c2: Vec;
  p2: Vec;
}

export type Segment = LineSegment | QuadSegment | CubicSegment;

export interface Path {
  segments: Segment[];
  closed: boolean;
  name?: string;
  /** Stable id used by CAM operations and the project format. */
  id?: string;
  /** Optional source metadata (e.g. original SVG element id). */
  sourceId?: string;
}

export interface Matrix {
  a: number;
  b: number;
  c: number;
  d: number;
  e: number;
  f: number;
}

export interface Bounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export const EPS = 1e-9;
export const IDENTITY: Matrix = { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 };

export function pt(x: number, y: number): Vec {
  return { x, y };
}

export function cloneVec(p: Vec): Vec {
  return { x: p.x, y: p.y };
}

export function add(a: Vec, b: Vec): Vec {
  return { x: a.x + b.x, y: a.y + b.y };
}

export function sub(a: Vec, b: Vec): Vec {
  return { x: a.x - b.x, y: a.y - b.y };
}

export function mul(a: Vec, s: number): Vec {
  return { x: a.x * s, y: a.y * s };
}

export function dot(a: Vec, b: Vec): number {
  return a.x * b.x + a.y * b.y;
}

export function cross(a: Vec, b: Vec): number {
  return a.x * b.y - a.y * b.x;
}

export function length(a: Vec): number {
  return Math.hypot(a.x, a.y);
}

export function dist(a: Vec, b: Vec): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function dist2(a: Vec, b: Vec): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return dx * dx + dy * dy;
}

export function lerp(a: Vec, b: Vec, t: number): Vec {
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
}

export function normalize(a: Vec): Vec {
  const l = length(a);
  return l < EPS ? { x: 0, y: 0 } : { x: a.x / l, y: a.y / l };
}

export function equals(a: Vec, b: Vec, tol = 1e-7): boolean {
  return Math.abs(a.x - b.x) <= tol && Math.abs(a.y - b.y) <= tol;
}

/** Signed angle from a to b, in (-pi, pi]. */
export function angleBetween(a: Vec, b: Vec): number {
  return Math.atan2(cross(a, b), dot(a, b));
}

export function segmentStart(s: Segment): Vec {
  return s.p1;
}

export function segmentEnd(s: Segment): Vec {
  return s.p2;
}

export function cloneSegment(s: Segment): Segment {
  switch (s.kind) {
    case 'line':
      return { kind: 'line', p1: cloneVec(s.p1), p2: cloneVec(s.p2) };
    case 'quad':
      return { kind: 'quad', p1: cloneVec(s.p1), c: cloneVec(s.c), p2: cloneVec(s.p2) };
    case 'cubic':
      return {
        kind: 'cubic',
        p1: cloneVec(s.p1),
        c1: cloneVec(s.c1),
        c2: cloneVec(s.c2),
        p2: cloneVec(s.p2),
      };
  }
}

export function reverseSegment(s: Segment): Segment {
  switch (s.kind) {
    case 'line':
      return { kind: 'line', p1: cloneVec(s.p2), p2: cloneVec(s.p1) };
    case 'quad':
      return { kind: 'quad', p1: cloneVec(s.p2), c: cloneVec(s.c), p2: cloneVec(s.p1) };
    case 'cubic':
      return {
        kind: 'cubic',
        p1: cloneVec(s.p2),
        c1: cloneVec(s.c2),
        c2: cloneVec(s.c1),
        p2: cloneVec(s.p1),
      };
  }
}

export function reversePath(path: Path): Path {
  return {
    ...path,
    segments: path.segments.slice().reverse().map(reverseSegment),
  };
}

export function clonePath(path: Path): Path {
  return {
    segments: path.segments.map(cloneSegment),
    closed: path.closed,
    name: path.name,
    id: path.id,
    sourceId: path.sourceId,
  };
}

/* ------------------------------------------------------------------ */
/* Matrices                                                            */
/* ------------------------------------------------------------------ */

export function matrixApply(m: Matrix, p: Vec): Vec {
  return {
    x: m.a * p.x + m.c * p.y + m.e,
    y: m.b * p.x + m.d * p.y + m.f,
  };
}

export function matrixApplyVector(m: Matrix, p: Vec): Vec {
  return { x: m.a * p.x + m.c * p.y, y: m.b * p.x + m.d * p.y };
}

/** Returns m1 ∘ m2 (m2 applied first). */
export function matrixMultiply(m1: Matrix, m2: Matrix): Matrix {
  return {
    a: m1.a * m2.a + m1.c * m2.b,
    b: m1.b * m2.a + m1.d * m2.b,
    c: m1.a * m2.c + m1.c * m2.d,
    d: m1.b * m2.c + m1.d * m2.d,
    e: m1.a * m2.e + m1.c * m2.f + m1.e,
    f: m1.b * m2.e + m1.d * m2.f + m1.f,
  };
}

export function matrixTranslate(x: number, y: number): Matrix {
  return { a: 1, b: 0, c: 0, d: 1, e: x, f: y };
}

export function matrixScale(sx: number, sy = sx): Matrix {
  return { a: sx, b: 0, c: 0, d: sy, e: 0, f: 0 };
}

export function matrixRotate(radians: number): Matrix {
  const c = Math.cos(radians);
  const s = Math.sin(radians);
  return { a: c, b: s, c: -s, d: c, e: 0, f: 0 };
}

export function matrixSkew(axRadians: number, ayRadians: number): Matrix {
  return { a: 1, b: Math.tan(ayRadians), c: Math.tan(axRadians), d: 1, e: 0, f: 0 };
}

export function matrixInvert(m: Matrix): Matrix {
  const det = m.a * m.d - m.b * m.c;
  if (Math.abs(det) < EPS) return { ...IDENTITY };
  const id = 1 / det;
  return {
    a: m.d * id,
    b: -m.b * id,
    c: -m.c * id,
    d: m.a * id,
    e: (m.c * m.f - m.d * m.e) * id,
    f: (m.b * m.e - m.a * m.f) * id,
  };
}

export function transformPath(path: Path, m: Matrix): Path {
  const tp = (p: Vec) => matrixApply(m, p);
  return {
    ...path,
    segments: path.segments.map((s) => {
      switch (s.kind) {
        case 'line':
          return { kind: 'line', p1: tp(s.p1), p2: tp(s.p2) } as LineSegment;
        case 'quad':
          return { kind: 'quad', p1: tp(s.p1), c: tp(s.c), p2: tp(s.p2) } as QuadSegment;
        case 'cubic':
          return {
            kind: 'cubic',
            p1: tp(s.p1),
            c1: tp(s.c1),
            c2: tp(s.c2),
            p2: tp(s.p2),
          } as CubicSegment;
      }
    }),
  };
}

/* ------------------------------------------------------------------ */
/* Flattening                                                          */
/* ------------------------------------------------------------------ */

function distancePointToLine(p: Vec, a: Vec, b: Vec): number {
  const abx = b.x - a.x;
  const aby = b.y - a.y;
  const l2 = abx * abx + aby * aby;
  if (l2 < EPS) return dist(p, a);
  let t = ((p.x - a.x) * abx + (p.y - a.y) * aby) / l2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(p.x - (a.x + abx * t), p.y - (a.y + aby * t));
}

/** Appends points along a segment to `out`, excluding the segment start. */
export function flattenSegment(
  seg: Segment,
  tolerance: number,
  out: Vec[],
  depth = 0,
): void {
  const tol = Math.max(tolerance, 1e-6);
  if (seg.kind === 'line') {
    out.push(cloneVec(seg.p2));
    return;
  }
  if (seg.kind === 'quad') {
    const flat = Math.max(distancePointToLine(seg.c, seg.p1, seg.p2), 0);
    if (flat <= tol || depth >= 20) {
      out.push(cloneVec(seg.p2));
      return;
    }
    const m01 = lerp(seg.p1, seg.c, 0.5);
    const m12 = lerp(seg.c, seg.p2, 0.5);
    const mid = lerp(m01, m12, 0.5);
    flattenSegment({ kind: 'quad', p1: seg.p1, c: m01, p2: mid }, tol, out, depth + 1);
    flattenSegment({ kind: 'quad', p1: mid, c: m12, p2: seg.p2 }, tol, out, depth + 1);
    return;
  }
  const flat = Math.max(
    distancePointToLine(seg.c1, seg.p1, seg.p2),
    distancePointToLine(seg.c2, seg.p1, seg.p2),
  );
  if (flat <= tol || depth >= 20) {
    out.push(cloneVec(seg.p2));
    return;
  }
  // de Casteljau split at t = 0.5
  const p01 = lerp(seg.p1, seg.c1, 0.5);
  const p12 = lerp(seg.c1, seg.c2, 0.5);
  const p23 = lerp(seg.c2, seg.p2, 0.5);
  const p012 = lerp(p01, p12, 0.5);
  const p123 = lerp(p12, p23, 0.5);
  const mid = lerp(p012, p123, 0.5);
  flattenSegment({ kind: 'cubic', p1: seg.p1, c1: p01, c2: p012, p2: mid }, tol, out, depth + 1);
  flattenSegment({ kind: 'cubic', p1: mid, c1: p123, c2: p23, p2: seg.p2 }, tol, out, depth + 1);
}

/**
 * Flattens a path to a polyline. The returned array starts at the first
 * segment's start point and includes every segment end point.
 */
export function flattenPath(path: Path, tolerance = 0.02): Vec[] {
  const out: Vec[] = [];
  if (path.segments.length === 0) return out;
  out.push(cloneVec(path.segments[0].p1));
  for (const seg of path.segments) flattenSegment(seg, tolerance, out);
  return out;
}

/** Closed polygon points (no duplicated closing point). */
export function closedPolygon(path: Path, tolerance = 0.02): Vec[] {
  const pts = flattenPath(path, tolerance);
  if (pts.length > 1 && equals(pts[0], pts[pts.length - 1], 1e-6)) pts.pop();
  return pts;
}

export function isClosedPath(path: Path, tol = 1e-5): boolean {
  if (path.closed) return true;
  if (path.segments.length === 0) return false;
  return equals(path.segments[0].p1, path.segments[path.segments.length - 1].p2, tol);
}

/* ------------------------------------------------------------------ */
/* Polygon helpers                                                     */
/* ------------------------------------------------------------------ */

/** Signed area: positive for counter-clockwise in a Y-up system. */
export function polygonArea(points: Vec[]): number {
  let a = 0;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    a += points[j].x * points[i].y - points[i].x * points[j].y;
  }
  return a * 0.5;
}

export function polygonPerimeter(points: Vec[]): number {
  let l = 0;
  for (let i = 0; i < points.length; i++) {
    l += dist(points[i], points[(i + 1) % points.length]);
  }
  return l;
}

export function pointInPolygon(points: Vec[], p: Vec, includeBoundary = true): boolean {
  let inside = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const a = points[i];
    const b = points[j];
    if (includeBoundary && distancePointToSegment(p, a, b) < 1e-7) return true;
    const intersects =
      a.y > p.y !== b.y > p.y &&
      p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y + (b.y === a.y ? 1e-30 : 0)) + a.x;
    if (intersects) inside = !inside;
  }
  return inside;
}

export function distancePointToSegment(p: Vec, a: Vec, b: Vec): number {
  return distancePointToLine(p, a, b);
}

export function distanceToPolyline(p: Vec, points: Vec[], closed = false): number {
  let best = Infinity;
  const n = points.length;
  const count = closed ? n : n - 1;
  for (let i = 0; i < count; i++) {
    best = Math.min(best, distancePointToSegment(p, points[i], points[(i + 1) % n]));
  }
  if (n === 1) best = dist(p, points[0]);
  return best;
}

export function polygonBounds(points: Vec[]): Bounds {
  if (points.length === 0) return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
  let minX = points[0].x;
  let maxX = points[0].x;
  let minY = points[0].y;
  let maxY = points[0].y;
  for (const p of points) {
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
  }
  return { minX, minY, maxX, maxY };
}

export function pathBounds(path: Path, tolerance = 0.02): Bounds {
  return polygonBounds(flattenPath(path, tolerance));
}

export function unionBounds(a: Bounds | null, b: Bounds): Bounds {
  if (!a) return { ...b };
  return {
    minX: Math.min(a.minX, b.minX),
    minY: Math.min(a.minY, b.minY),
    maxX: Math.max(a.maxX, b.maxX),
    maxY: Math.max(a.maxY, b.maxY),
  };
}

export function pointsBounds(list: Vec[][]): Bounds | null {
  let b: Bounds | null = null;
  for (const pts of list) b = unionBounds(b, polygonBounds(pts));
  return b;
}

export function rotatePoints(points: Vec[], angleRad: number, around: Vec = { x: 0, y: 0 }): Vec[] {
  const c = Math.cos(angleRad);
  const s = Math.sin(angleRad);
  return points.map((p) => {
    const x = p.x - around.x;
    const y = p.y - around.y;
    return { x: around.x + c * x - s * y, y: around.y + s * x + c * y };
  });
}

export function ensureOrientation(points: Vec[], ccw: boolean): Vec[] {
  const isCcw = polygonArea(points) > 0;
  return isCcw === ccw ? points : points.slice().reverse();
}

export function rotatePointsToStart(points: Vec[], index: number): Vec[] {
  if (points.length === 0) return points;
  const i = ((index % points.length) + points.length) % points.length;
  return points.slice(i).concat(points.slice(0, i));
}

export function nearestPointIndex(points: Vec[], target: Vec): number {
  let best = 0;
  let bestD = Infinity;
  for (let i = 0; i < points.length; i++) {
    const d = dist2(points[i], target);
    if (d < bestD) {
      bestD = d;
      best = i;
    }
  }
  return best;
}

/** Removes consecutive duplicate points. */
export function dedupePoints(points: Vec[], tol = 1e-6): Vec[] {
  const out: Vec[] = [];
  for (const p of points) {
    if (out.length === 0 || !equals(out[out.length - 1], p, tol)) out.push(p);
  }
  if (out.length > 1 && equals(out[0], out[out.length - 1], tol)) out.pop();
  return out;
}

/* ------------------------------------------------------------------ */
/* Lengths and sampling                                                */
/* ------------------------------------------------------------------ */

export function segmentLength(seg: Segment, tolerance = 0.02): number {
  const out: Vec[] = [seg.p1];
  flattenSegment(seg, tolerance, out);
  let l = 0;
  for (let i = 1; i < out.length; i++) l += dist(out[i - 1], out[i]);
  return l;
}

export function pathLength(path: Path, tolerance = 0.02): number {
  return path.segments.reduce((sum, s) => sum + segmentLength(s, tolerance), 0);
}

/* ------------------------------------------------------------------ */
/* SVG path data parsing                                               */
/* ------------------------------------------------------------------ */

interface SubPathData {
  segments: Segment[];
  closed: boolean;
}

const NUMBER_RE = /[+-]?(?:(?:\d+\.?\d*)|(?:\.\d+))(?:[eE][+-]?\d+)?/g;

/** Converts an SVG elliptical arc into cubic Bézier segments. */
export function svgArcToCubics(
  p1: Vec,
  rxIn: number,
  ryIn: number,
  xAxisRotationDeg: number,
  largeArc: boolean,
  sweep: boolean,
  p2: Vec,
): CubicSegment[] {
  let rx = Math.abs(rxIn);
  let ry = Math.abs(ryIn);
  if (rx < EPS || ry < EPS || equals(p1, p2)) {
    if (equals(p1, p2)) return [];
    return [{ kind: 'cubic', p1, c1: lerp(p1, p2, 1 / 3), c2: lerp(p1, p2, 2 / 3), p2 }];
  }
  const phi = (xAxisRotationDeg * Math.PI) / 180;
  const cosPhi = Math.cos(phi);
  const sinPhi = Math.sin(phi);
  const dx = (p1.x - p2.x) / 2;
  const dy = (p1.y - p2.y) / 2;
  const x1p = cosPhi * dx + sinPhi * dy;
  const y1p = -sinPhi * dx + cosPhi * dy;

  const lambda = (x1p * x1p) / (rx * rx) + (y1p * y1p) / (ry * ry);
  if (lambda > 1) {
    const s = Math.sqrt(lambda);
    rx *= s;
    ry *= s;
  }

  const sign = largeArc === sweep ? -1 : 1;
  const num = rx * rx * ry * ry - rx * rx * y1p * y1p - ry * ry * x1p * x1p;
  const den = rx * rx * y1p * y1p + ry * ry * x1p * x1p;
  const coef = sign * Math.sqrt(Math.max(0, num / den));
  const cxp = (coef * (rx * y1p)) / ry;
  const cyp = (coef * -(ry * x1p)) / rx;
  const cx = cosPhi * cxp - sinPhi * cyp + (p1.x + p2.x) / 2;
  const cy = sinPhi * cxp + cosPhi * cyp + (p1.y + p2.y) / 2;

  const angle = (ux: number, uy: number, vx: number, vy: number): number => {
    const dotv = ux * vx + uy * vy;
    const lenv = Math.hypot(ux, uy) * Math.hypot(vx, vy);
    let a = Math.acos(Math.max(-1, Math.min(1, dotv / (lenv || 1))));
    if (ux * vy - uy * vx < 0) a = -a;
    return a;
  };

  const theta1 = angle(1, 0, (x1p - cxp) / rx, (y1p - cyp) / ry);
  let delta = angle(
    (x1p - cxp) / rx,
    (y1p - cyp) / ry,
    (-x1p - cxp) / rx,
    (-y1p - cyp) / ry,
  );
  if (!sweep && delta > 0) delta -= 2 * Math.PI;
  if (sweep && delta < 0) delta += 2 * Math.PI;

  const nseg = Math.max(1, Math.ceil(Math.abs(delta) / (Math.PI / 2)));
  const deltaSeg = delta / nseg;
  const out: CubicSegment[] = [];
  let theta = theta1;

  const mapPoint = (th: number): Vec => {
    const cosT = Math.cos(th);
    const sinT = Math.sin(th);
    return {
      x: cx + cosPhi * rx * cosT - sinPhi * ry * sinT,
      y: cy + sinPhi * rx * cosT + cosPhi * ry * sinT,
    };
  };
  const mapDeriv = (th: number): Vec => {
    const cosT = Math.cos(th);
    const sinT = Math.sin(th);
    return {
      x: -cosPhi * rx * sinT - sinPhi * ry * cosT,
      y: -sinPhi * rx * sinT + cosPhi * ry * cosT,
    };
  };

  let start = p1;
  for (let i = 0; i < nseg; i++) {
    const theta2 = theta + deltaSeg;
    const end = mapPoint(theta2);
    const k = (4 / 3) * Math.tan((theta2 - theta) / 4);
    const d1 = mapDeriv(theta);
    const d2 = mapDeriv(theta2);
    out.push({
      kind: 'cubic',
      p1: start,
      c1: { x: start.x + k * d1.x, y: start.y + k * d1.y },
      c2: { x: end.x - k * d2.x, y: end.y - k * d2.y },
      p2: end,
    });
    start = end;
    theta = theta2;
  }
  // Snap the final endpoint to the requested one to avoid round-off drift.
  if (out.length > 0) out[out.length - 1].p2 = cloneVec(p2);
  return out;
}

/**
 * Parses an SVG `d` attribute. Supports M L H V C S Q T A Z (absolute and
 * relative). Multiple subpaths are returned separately.
 */
export function parseSvgPathData(d: string): SubPathData[] {
  const tokens = d.match(/[a-zA-Z]|[+-]?(?:(?:\d+\.?\d*)|(?:\.\d+))(?:[eE][+-]?\d+)?/g);
  if (!tokens) return [];

  const result: SubPathData[] = [];
  let current: SubPathData | null = null;
  let cur: Vec = { x: 0, y: 0 };
  let start: Vec = { x: 0, y: 0 };
  let lastCubicC2: Vec | null = null;
  let lastQuadC: Vec | null = null;
  let command = '';
  let index = 0;

  const newSubPath = (p: Vec) => {
    if (current && current.segments.length > 0) result.push(current);
    current = { segments: [], closed: false };
    cur = cloneVec(p);
    start = cloneVec(p);
  };

  const ensure = (): SubPathData => {
    if (!current) newSubPath(cur);
    return current as SubPathData;
  };

  const isCommand = (t: string) => /^[a-zA-Z]$/.test(t);
  const takeNumber = (): number => {
    const t = tokens[index++];
    if (t === undefined || isCommand(t)) throw new Error(`Expected number in path data near token ${index}`);
    return Number(t);
  };
  const hasNumber = (): boolean => {
    const t = tokens[index];
    return t !== undefined && !isCommand(t);
  };

  // Skip any leading whitespace already handled by regex.
  while (index < tokens.length) {
    if (isCommand(tokens[index])) {
      command = tokens[index++];
    } else if (!command) {
      index++;
      continue;
    }
    if (!command) break;
    const rel = command === command.toLowerCase();
    const cmd = command.toUpperCase();
    const origin = (p: Vec): Vec => (rel ? { x: cur.x + p.x, y: cur.y + p.y } : p);
    const originXY = (x: number, y: number): Vec => origin({ x, y });

    switch (cmd) {
      case 'M': {
        const p = originXY(takeNumber(), takeNumber());
        newSubPath(p);
        command = rel ? 'l' : 'L';
        lastCubicC2 = lastQuadC = null;
        break;
      }
      case 'L': {
        const p = originXY(takeNumber(), takeNumber());
        ensure().segments.push({ kind: 'line', p1: cur, p2: p });
        cur = p;
        lastCubicC2 = lastQuadC = null;
        break;
      }
      case 'H': {
        const x = takeNumber();
        const p = rel ? { x: cur.x + x, y: cur.y } : { x, y: cur.y };
        ensure().segments.push({ kind: 'line', p1: cur, p2: p });
        cur = p;
        lastCubicC2 = lastQuadC = null;
        break;
      }
      case 'V': {
        const y = takeNumber();
        const p = rel ? { x: cur.x, y: cur.y + y } : { x: cur.x, y };
        ensure().segments.push({ kind: 'line', p1: cur, p2: p });
        cur = p;
        lastCubicC2 = lastQuadC = null;
        break;
      }
      case 'C': {
        const c1 = originXY(takeNumber(), takeNumber());
        const c2 = originXY(takeNumber(), takeNumber());
        const p = originXY(takeNumber(), takeNumber());
        ensure().segments.push({ kind: 'cubic', p1: cur, c1, c2, p2: p });
        cur = p;
        lastCubicC2 = c2;
        lastQuadC = null;
        break;
      }
      case 'S': {
        const c2 = originXY(takeNumber(), takeNumber());
        const p = originXY(takeNumber(), takeNumber());
        const c1 = lastCubicC2
          ? { x: 2 * cur.x - lastCubicC2.x, y: 2 * cur.y - lastCubicC2.y }
          : cloneVec(cur);
        ensure().segments.push({ kind: 'cubic', p1: cur, c1, c2, p2: p });
        cur = p;
        lastCubicC2 = c2;
        lastQuadC = null;
        break;
      }
      case 'Q': {
        const c = originXY(takeNumber(), takeNumber());
        const p = originXY(takeNumber(), takeNumber());
        ensure().segments.push({ kind: 'quad', p1: cur, c, p2: p });
        cur = p;
        lastQuadC = c;
        lastCubicC2 = null;
        break;
      }
      case 'T': {
        const p = originXY(takeNumber(), takeNumber());
        const c: Vec = lastQuadC
          ? { x: 2 * cur.x - lastQuadC.x, y: 2 * cur.y - lastQuadC.y }
          : cloneVec(cur);
        ensure().segments.push({ kind: 'quad', p1: cur, c, p2: p });
        cur = p;
        lastQuadC = c;
        lastCubicC2 = null;
        break;
      }
      case 'A': {
        const rx = takeNumber();
        const ry = takeNumber();
        const rot = takeNumber();
        const large = takeNumber() !== 0;
        const sweep = takeNumber() !== 0;
        const p = originXY(takeNumber(), takeNumber());
        const cubics = svgArcToCubics(cur, rx, ry, rot, large, sweep, p);
        ensure().segments.push(...cubics);
        cur = p;
        lastCubicC2 = lastQuadC = null;
        break;
      }
      case 'Z': {
        const sp = ensure();
        if (sp.segments.length > 0 && !equals(cur, start, 1e-7)) {
          sp.segments.push({ kind: 'line', p1: cur, p2: cloneVec(start) });
        }
        sp.closed = true;
        cur = cloneVec(start);
        lastCubicC2 = lastQuadC = null;
        // A number after Z is invalid; skip it rather than looping forever.
        if (index < tokens.length && !isCommand(tokens[index])) index++;
        break;
      }
      default:
        index++;
    }

    // For commands that accept repeated coordinate sets, loop again without
    // consuming a new command letter; stop when the next token is a command.
    if (cmd === 'M') {
      // M's implicit subsequent pairs are lineto, already set.
    }
    if (!hasNumber() && index < tokens.length && !isCommand(tokens[index])) {
      // Should not happen with the tokenizer, but guard.
      break;
    }
  }
  if (current && (current as SubPathData).segments.length > 0) result.push(current);
  return result;
}

/* ------------------------------------------------------------------ */
/* Shape builders                                                      */
/* ------------------------------------------------------------------ */

const KAPPA = 0.5522847498307936;

export function rectPath(x: number, y: number, w: number, h: number): Path {
  return {
    closed: true,
    segments: [
      { kind: 'line', p1: pt(x, y), p2: pt(x + w, y) },
      { kind: 'line', p1: pt(x + w, y), p2: pt(x + w, y + h) },
      { kind: 'line', p1: pt(x + w, y + h), p2: pt(x, y + h) },
      { kind: 'line', p1: pt(x, y + h), p2: pt(x, y) },
    ],
  };
}

export function roundedRectPath(
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): Path {
  const rr = Math.max(0, Math.min(r, Math.min(w, h) / 2));
  if (rr < 1e-9) return rectPath(x, y, w, h);
  const k = KAPPA * rr;
  const segs: Segment[] = [];
  segs.push({ kind: 'line', p1: pt(x + rr, y), p2: pt(x + w - rr, y) });
  segs.push({
    kind: 'cubic',
    p1: pt(x + w - rr, y),
    c1: pt(x + w - rr + k, y),
    c2: pt(x + w, y + rr - k),
    p2: pt(x + w, y + rr),
  });
  segs.push({ kind: 'line', p1: pt(x + w, y + rr), p2: pt(x + w, y + h - rr) });
  segs.push({
    kind: 'cubic',
    p1: pt(x + w, y + h - rr),
    c1: pt(x + w, y + h - rr + k),
    c2: pt(x + w - rr + k, y + h),
    p2: pt(x + w - rr, y + h),
  });
  segs.push({ kind: 'line', p1: pt(x + w - rr, y + h), p2: pt(x + rr, y + h) });
  segs.push({
    kind: 'cubic',
    p1: pt(x + rr, y + h),
    c1: pt(x + rr - k, y + h),
    c2: pt(x, y + h - rr + k),
    p2: pt(x, y + h - rr),
  });
  segs.push({ kind: 'line', p1: pt(x, y + h - rr), p2: pt(x, y + rr) });
  segs.push({
    kind: 'cubic',
    p1: pt(x, y + rr),
    c1: pt(x, y + rr - k),
    c2: pt(x + rr - k, y),
    p2: pt(x + rr, y),
  });
  return { closed: true, segments: segs };
}

export function ellipsePath(cx: number, cy: number, rx: number, ry: number): Path {
  const kx = KAPPA * rx;
  const ky = KAPPA * ry;
  const segs: Segment[] = [
    { kind: 'cubic', p1: pt(cx + rx, cy), c1: pt(cx + rx, cy + ky), c2: pt(cx + kx, cy + ry), p2: pt(cx, cy + ry) },
    { kind: 'cubic', p1: pt(cx, cy + ry), c1: pt(cx - kx, cy + ry), c2: pt(cx - rx, cy + ky), p2: pt(cx - rx, cy) },
    { kind: 'cubic', p1: pt(cx - rx, cy), c1: pt(cx - rx, cy - ky), c2: pt(cx - kx, cy - ry), p2: pt(cx, cy - ry) },
    { kind: 'cubic', p1: pt(cx, cy - ry), c1: pt(cx + kx, cy - ry), c2: pt(cx + rx, cy - ky), p2: pt(cx + rx, cy) },
  ];
  return { closed: true, segments: segs };
}

export function polygonPath(cx: number, cy: number, radius: number, sides: number, startAngle = Math.PI / 2): Path {
  const n = Math.max(3, Math.floor(sides));
  const segs: Segment[] = [];
  let prev = pt(cx + radius * Math.cos(startAngle), cy + radius * Math.sin(startAngle));
  const first = prev;
  for (let i = 1; i < n; i++) {
    const a = startAngle + (i * 2 * Math.PI) / n;
    const p = pt(cx + radius * Math.cos(a), cy + radius * Math.sin(a));
    segs.push({ kind: 'line', p1: prev, p2: p });
    prev = p;
  }
  segs.push({ kind: 'line', p1: prev, p2: first });
  return { closed: true, segments: segs };
}

export function starPath(cx: number, cy: number, radius: number, points: number, pointinessPct: number): Path {
  const n = Math.max(3, Math.floor(points));
  const inner = radius * Math.max(0, Math.min(0.99, 1 - pointinessPct / 100));
  const segs: Segment[] = [];
  const angleStep = (2 * Math.PI) / n;
  const start = -Math.PI / 2;
  let first = pt(cx + radius * Math.cos(start), cy + radius * Math.sin(start));
  let prev = first;
  for (let i = 1; i <= n; i++) {
    const aOuter = start + i * angleStep;
    const aInner = aOuter - angleStep / 2;
    const pInner = pt(cx + inner * Math.cos(aInner), cy + inner * Math.sin(aInner));
    segs.push({ kind: 'line', p1: prev, p2: pInner });
    const pOuter = i === n ? first : pt(cx + radius * Math.cos(aOuter), cy + radius * Math.sin(aOuter));
    segs.push({ kind: 'line', p1: pInner, p2: pOuter });
    prev = pOuter;
  }
  return { closed: true, segments: segs };
}

/* ------------------------------------------------------------------ */
/* Path normalisation                                                  */
/* ------------------------------------------------------------------ */

/** Splits a path at gaps between consecutive segments. */
export function splitDiscontinuous(path: Path): Path[] {
  const out: Path[] = [];
  let currentSegs: Segment[] = [];
  for (const seg of path.segments) {
    if (currentSegs.length > 0 && !equals(currentSegs[currentSegs.length - 1].p2, seg.p1, 1e-5)) {
      out.push({ segments: currentSegs, closed: false });
      currentSegs = [];
    }
    currentSegs.push(seg);
  }
  if (currentSegs.length > 0) out.push({ segments: currentSegs, closed: path.closed });
  return out;
}

/** Removes zero-length segments and joins segment endpoints that are close. */
export function cleanPath(path: Path, tol = 1e-4): Path {
  const segs: Segment[] = [];
  for (const seg of path.segments) {
    if (dist(seg.p1, seg.p2) <= tol) {
      if (seg.kind === 'line') continue;
    }
    if (segs.length > 0) {
      const prev = segs[segs.length - 1];
      if (!equals(prev.p2, seg.p1, tol)) {
        // leave a gap; caller can split
      } else {
        seg.p1 = cloneVec(prev.p2);
      }
    }
    segs.push(seg);
  }
  return { ...path, segments: segs, closed: isClosedPath({ ...path, segments: segs }, tol) };
}

/** Computes path bounding box using flattened geometry. */
export function pathCentroid(path: Path, tolerance = 0.02): Vec {
  const pts = flattenPath(path, tolerance);
  if (pts.length === 0) return { x: 0, y: 0 };
  let x = 0;
  let y = 0;
  for (const p of pts) {
    x += p.x;
    y += p.y;
  }
  return { x: x / pts.length, y: y / pts.length };
}

export function segmentMidpoint(seg: Segment): Vec {
  switch (seg.kind) {
    case 'line':
      return lerp(seg.p1, seg.p2, 0.5);
    case 'quad':
      return {
        x: 0.25 * seg.p1.x + 0.5 * seg.c.x + 0.25 * seg.p2.x,
        y: 0.25 * seg.p1.y + 0.5 * seg.c.y + 0.25 * seg.p2.y,
      };
    case 'cubic': {
      const t = 0.5;
      const mt = 0.5;
      const a = mt * mt * mt;
      const b = 3 * mt * mt * t;
      const c = 3 * mt * t * t;
      const d = t * t * t;
      return {
        x: a * seg.p1.x + b * seg.c1.x + c * seg.c2.x + d * seg.p2.x,
        y: a * seg.p1.y + b * seg.c1.y + c * seg.c2.y + d * seg.p2.y,
      };
    }
  }
}

export function snapPointToSegments(point: Vec, paths: Path[], tolerance: number): Vec | null {
  let best: Vec | null = null;
  let bestD = tolerance;
  for (const path of paths) {
    for (const seg of path.segments) {
      const pts = flattenPath({ segments: [seg], closed: false }, Math.min(0.05, tolerance));
      for (let i = 0; i < pts.length - 1; i++) {
        const d = distancePointToSegment(point, pts[i], pts[i + 1]);
        if (d <= bestD) {
          bestD = d;
          const a = pts[i];
          const b = pts[i + 1];
          const abx = b.x - a.x;
          const aby = b.y - a.y;
          const l2 = abx * abx + aby * aby;
          const t = l2 > 0 ? Math.max(0, Math.min(1, ((point.x - a.x) * abx + (point.y - a.y) * aby) / l2)) : 0;
          best = { x: a.x + abx * t, y: a.y + aby * t };
        }
      }
    }
  }
  return best;
}
