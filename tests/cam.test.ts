import { describe, expect, it } from 'vitest';
import {
  DEFAULT_PARAMS,
  addTabsToLoops,
  applyDirection,
  generateToolpath,
  offsetRegion,
  pathsToLoops,
  type OperationParams,
} from '../src/cam';
import { ellipsePath, flattenPath, polygonArea, polygonBounds, rectPath, isClosedPath } from '../src/geom';

function params(over: Partial<OperationParams> = {}): OperationParams {
  return { ...DEFAULT_PARAMS('mm'), ...over };
}

function square(size = 100) {
  return { ...rectPath(0, 0, size, size), id: 'sq' };
}

function circle(radius = 50) {
  return { ...ellipsePath(0, 0, radius, radius), id: 'c' };
}

describe('region offset', () => {
  it('grows a square by the cutter radius (outside profile)', () => {
    const loops = pathsToLoops([square(100)], 0.01);
    const out = offsetRegion(loops, 5);
    expect(out).toHaveLength(1);
    const b = polygonBounds(out[0].points);
    expect(b.minX).toBeCloseTo(-5, 1);
    expect(b.minY).toBeCloseTo(-5, 1);
    expect(b.maxX).toBeCloseTo(105, 1);
    expect(b.maxY).toBeCloseTo(105, 1);
  });

  it('shrinks a square by the cutter radius (inside profile)', () => {
    const loops = pathsToLoops([square(100)], 0.01);
    const out = offsetRegion(loops, -5);
    expect(out).toHaveLength(1);
    const b = polygonBounds(out[0].points);
    expect(b.minX).toBeCloseTo(5, 1);
    expect(b.maxX).toBeCloseTo(95, 1);
  });

  it('offsets a square with a hole in the correct direction', () => {
    const outer = { ...rectPath(0, 0, 100, 100), id: 'o' };
    const hole = { ...rectPath(30, 30, 40, 40), id: 'h' };
    const loops = pathsToLoops([outer, hole], 0.01);
    expect(loops).toHaveLength(2);
    const grown = offsetRegion(loops, 5);
    // Outer expands to 110x110 and the hole shrinks to 30x30.
    const areas = grown.map((l) => Math.abs(polygonArea(l.points))).sort((a, b) => b - a);
    expect(areas[0]).toBeGreaterThan(11500);
    expect(areas[1]).toBeLessThan(1000);
  });
});

describe('toolpaths', () => {
  it('creates an outside profile with an offset boundary', () => {
    const result = generateToolpath('profile', params({ outside: true, toolDiameter: 10 }), [square(100)], 0.01);
    expect(result.warnings).toHaveLength(0);
    expect(result.loops).toHaveLength(1);
    const b = polygonBounds(result.loops[0].points);
    expect(b.minX).toBeCloseTo(-5, 1);
  });

  it('creates an inside profile', () => {
    const result = generateToolpath('profile', params({ outside: false, toolDiameter: 10 }), [square(100)], 0.01);
    expect(result.loops).toHaveLength(1);
    const b = polygonBounds(result.loops[0].points);
    expect(b.minX).toBeCloseTo(5, 1);
  });

  it('creates multiple concentric pocket loops', () => {
    const result = generateToolpath(
      'pocket',
      params({ toolDiameter: 10, stepover: 0.4 }),
      [square(100)],
      0.05,
    );
    expect(result.loops.length).toBeGreaterThan(2);
    const levels = new Set(result.loops.map((l) => l.pocketDepth));
    expect(levels.size).toBeGreaterThan(2);
    const first = result.loops.find((l) => l.pocketDepth === 0)!;
    const b = polygonBounds(first.points);
    expect(b.minX).toBeCloseTo(5, 0);
  });

  it('follows a circle without offsetting it', () => {
    const c = circle(50);
    const result = generateToolpath('follow', params({ toolDiameter: 6 }), [c], 0.02);
    expect(result.loops).toHaveLength(1);
    expect(result.loops[0].closed).toBe(true);
    const b = polygonBounds(result.loops[0].points);
    expect(b.minX).toBeCloseTo(-50, 0);
    expect(b.maxX).toBeCloseTo(50, 0);
  });

  it('follows an open path', () => {
    const line = {
      id: 'l',
      closed: false,
      segments: [{ kind: 'line' as const, p1: { x: 0, y: 0 }, p2: { x: 100, y: 0 } }],
    };
    const result = generateToolpath('follow', params(), [line], 0.02);
    expect(result.loops).toHaveLength(1);
    expect(result.loops[0].closed).toBe(false);
    expect(result.loops[0].points).toHaveLength(2);
  });

  it('finds drill centres', () => {
    const result = generateToolpath('drill', params({ center: true }), [square(100)], 0.02);
    expect(result.drillPoints).toHaveLength(1);
    expect(result.drillPoints[0].x).toBeCloseTo(50, 0);
    expect(result.drillPoints[0].y).toBeCloseTo(50, 0);
  });

  it('creates a fill drilling pattern', () => {
    const result = generateToolpath(
      'drill',
      params({ center: false, spacing: 20 }),
      [square(100)],
      0.02,
    );
    expect(result.drillPoints.length).toBeGreaterThan(10);
  });

  it('places a fixed number of holes along an open path', () => {
    const line = {
      id: 'l',
      closed: false,
      segments: [{ kind: 'line' as const, p1: { x: 0, y: 0 }, p2: { x: 120, y: 0 } }],
    };
    const result = generateToolpath('drillpath', params({ holeCount: 4 }), [line], 0.02);
    expect(result.warnings).toHaveLength(0);
    expect(result.loops).toHaveLength(0);
    expect(result.drillPoints).toHaveLength(4);
    const xs = result.drillPoints.map((p) => p.x);
    expect(xs[0]).toBeCloseTo(0, 6);
    expect(xs[1]).toBeCloseTo(40, 6);
    expect(xs[2]).toBeCloseTo(80, 6);
    expect(xs[3]).toBeCloseTo(120, 6);
    for (const p of result.drillPoints) expect(p.y).toBeCloseTo(0, 6);
  });

  it('places holes evenly around a closed path', () => {
    const result = generateToolpath('drillpath', params({ holeCount: 4 }), [square(100)], 0.02);
    expect(result.drillPoints).toHaveLength(4);
    const coords = result.drillPoints.map((p) => [p.x, p.y]);
    expect(coords[0][0]).toBeCloseTo(0, 6);
    expect(coords[0][1]).toBeCloseTo(0, 6);
    expect(coords[1][0]).toBeCloseTo(100, 6);
    expect(coords[1][1]).toBeCloseTo(0, 6);
    expect(coords[2][0]).toBeCloseTo(100, 6);
    expect(coords[2][1]).toBeCloseTo(100, 6);
    expect(coords[3][0]).toBeCloseTo(0, 6);
    expect(coords[3][1]).toBeCloseTo(100, 6);
  });

  it('puts a single hole at the midpoint of an open path', () => {
    const line = {
      id: 'l',
      closed: false,
      segments: [{ kind: 'line' as const, p1: { x: 10, y: 20 }, p2: { x: 30, y: 20 } }],
    };
    const result = generateToolpath('drillpath', params({ holeCount: 1 }), [line], 0.02);
    expect(result.drillPoints).toHaveLength(1);
    expect(result.drillPoints[0].x).toBeCloseTo(20, 6);
    expect(result.drillPoints[0].y).toBeCloseTo(20, 6);
  });

  it('adds tabs along a loop', () => {
    const loops = applyDirection(
      offsetRegion(pathsToLoops([square(100)], 0.02), 5),
      1,
    );
    const withTabs = addTabsToLoops(loops, 30, 5, 3);
    expect(withTabs[0].tabs.length).toBeGreaterThan(0);
    for (const tab of withTabs[0].tabs) {
      expect(tab.width).toBe(5);
      expect(tab.height).toBe(3);
    }
  });

  it('splits a self-intersecting bow-tie into valid loops', () => {
    const bowtie = {
      id: 'bow',
      closed: true,
      segments: [
        { kind: 'line' as const, p1: { x: 0, y: 0 }, p2: { x: 10, y: 10 } },
        { kind: 'line' as const, p1: { x: 10, y: 10 }, p2: { x: 10, y: 0 } },
        { kind: 'line' as const, p1: { x: 10, y: 0 }, p2: { x: 0, y: 10 } },
        { kind: 'line' as const, p1: { x: 0, y: 10 }, p2: { x: 0, y: 0 } },
      ],
    };
    const loops = pathsToLoops([bowtie], 0.01);
    expect(loops.length).toBe(2);
    for (const loop of loops) expect(Math.abs(polygonArea(loop.points))).toBeGreaterThan(1);
    const result = generateToolpath('profile', params({ toolDiameter: 2 }), [bowtie], 0.01);
    expect(result.loops.length).toBeGreaterThanOrEqual(1);
  });

  it('treats partially overlapping paths as two outer boundaries', () => {
    const a = { ...rectPath(0, 0, 10, 10), id: 'a' };
    const b = { ...rectPath(5, 5, 10, 10), id: 'b' };
    const loops = pathsToLoops([a, b], 0.001);
    expect(loops).toHaveLength(2);
    expect(loops.every((l) => l.depth === 0)).toBe(true);
  });

  it('treats a fully enclosed path as a hole', () => {
    const outer = { ...rectPath(0, 0, 20, 20), id: 'o' };
    const inner = { ...rectPath(5, 5, 10, 10), id: 'i' };
    const loops = pathsToLoops([outer, inner], 0.001);
    const depths = loops.map((l) => l.depth).sort();
    expect(depths).toEqual([0, 1]);
  });

  it('rejects open paths for profile operations', () => {
    const open = {
      id: 'o',
      closed: false,
      segments: [{ kind: 'line' as const, p1: { x: 0, y: 0 }, p2: { x: 10, y: 0 } }],
    };
    const result = generateToolpath('profile', params(), [open], 0.02);
    expect(result.loops).toHaveLength(0);
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it('names the skipped open path and reports its gap', () => {
    const open = {
      id: 'gap-path',
      name: 'Outer plate',
      closed: false,
      segments: [{ kind: 'line' as const, p1: { x: 0, y: 0 }, p2: { x: 10, y: 0 } }],
    };
    const result = generateToolpath('profile', params(), [open], 0.02);
    expect(result.warnings[0]).toContain('Outer plate');
    expect(result.warnings[0]).toContain('10 mm');
    expect(result.warnings.some((w) => /closed path/i.test(w))).toBe(true);
  });

  it('warns about open paths even when closed paths are usable', () => {
    const open = {
      id: 'gap-path',
      closed: false,
      segments: [{ kind: 'line' as const, p1: { x: 0, y: 0 }, p2: { x: 10, y: 0 } }],
    };
    const result = generateToolpath(
      'profile',
      params({ outside: true, toolDiameter: 6 }),
      [square(50), open],
      0.01,
    );
    expect(result.loops.length).toBeGreaterThan(0);
    expect(result.warnings.some((w) => w.includes('gap-path'))).toBe(true);
  });
});
