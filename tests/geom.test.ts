import { describe, expect, it } from 'vitest';
import {
  Matrix,
  clonePath,
  ellipsePath,
  flattenPath,
  isClosedPath,
  matrixMultiply,
  matrixRotate,
  matrixScale,
  matrixTranslate,
  parseSvgPathData,
  pointInPolygon,
  polygonArea,
  polygonBounds,
  rectPath,
  reversePath,
  transformPath,
} from '../src/geom';

describe('SVG path data', () => {
  it('parses lines and closes a subpath', () => {
    const subs = parseSvgPathData('M0 0 L10 0 L10 10 Z');
    expect(subs).toHaveLength(1);
    expect(subs[0].segments).toHaveLength(3);
    expect(subs[0].closed).toBe(true);
    expect(subs[0].segments[0].p1).toEqual({ x: 0, y: 0 });
    expect(subs[0].segments[2].p2).toEqual({ x: 0, y: 0 });
  });

  it('parses relative commands and repeated coordinate sets', () => {
    const subs = parseSvgPathData('m 0 0 l 10 0 0 10 z');
    expect(subs[0].segments).toHaveLength(3);
    expect(subs[0].segments[1].p2).toEqual({ x: 10, y: 10 });
  });

  it('parses cubic, smooth cubic, quadratic and smooth quadratic curves', () => {
    const subs = parseSvgPathData('M0 0 C1 2 3 4 5 6 S7 8 9 10 Q11 12 13 14 T15 16');
    expect(subs[0].segments.map((s) => s.kind)).toEqual(['cubic', 'cubic', 'quad', 'quad']);
  });

  it('parses multiple subpaths', () => {
    const subs = parseSvgPathData('M0 0 L10 0 M20 20 L30 20');
    expect(subs).toHaveLength(2);
    expect(subs[1].segments[0].p1).toEqual({ x: 20, y: 20 });
  });

  it('converts an elliptical arc to cubics', () => {
    const subs = parseSvgPathData('M0 0 A10 10 0 0 1 20 0');
    const segs = subs[0].segments;
    expect(segs.length).toBeGreaterThan(0);
    expect(segs[segs.length - 1].p2.x).toBeCloseTo(20, 6);
    expect(segs[segs.length - 1].p2.y).toBeCloseTo(0, 6);
    // A semi-circle must bulge away from the chord, not collapse to a line.
    const pts = flattenPath({ segments: segs, closed: false }, 0.01);
    const maxAbsY = Math.max(...pts.map((p) => Math.abs(p.y)));
    expect(maxAbsY).toBeGreaterThan(9.9);
    expect(maxAbsY).toBeLessThan(10.1);
  });
});

describe('paths and polygons', () => {
  it('builds a closed rectangular path with positive area', () => {
    const p = rectPath(0, 0, 10, 20);
    expect(isClosedPath(p)).toBe(true);
    const pts = flattenPath(p);
    expect(Math.abs(polygonArea(pts))).toBeCloseTo(200, 6);
    expect(polygonBounds(pts)).toEqual({ minX: 0, minY: 0, maxX: 10, maxY: 20 });
  });

  it('flattens an ellipse to a smooth closed polygon', () => {
    const p = ellipsePath(0, 0, 10, 5);
    const pts = flattenPath(p, 0.01);
    expect(pts.length).toBeGreaterThan(20);
    expect(Math.abs(polygonArea(pts))).toBeGreaterThan(140);
    expect(Math.abs(polygonArea(pts))).toBeLessThan(165);
  });

  it('tests point-in-polygon', () => {
    const pts = [{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 10 }, { x: 0, y: 10 }];
    expect(pointInPolygon(pts, { x: 5, y: 5 })).toBe(true);
    expect(pointInPolygon(pts, { x: 15, y: 5 })).toBe(false);
  });

  it('preserves ids when cloning a path', () => {
    const p = { ...rectPath(0, 0, 10, 10), id: 'keep-me' };
    expect(clonePath(p).id).toBe('keep-me');
  });

  it('reverses a path without changing its shape', () => {
    const p = rectPath(0, 0, 10, 10);
    const r = reversePath(p);
    expect(r.segments[0].p1).toEqual(p.segments[p.segments.length - 1].p2);
    expect(Math.abs(polygonArea(flattenPath(r)))).toBeCloseTo(100, 6);
  });
});

describe('matrices', () => {
  it('composes translate and scale in the expected order', () => {
    const m: Matrix = matrixMultiply(matrixTranslate(10, 20), matrixScale(2));
    const p = transformPath(rectPath(0, 0, 10, 10), m);
    const b = polygonBounds(flattenPath(p));
    expect(b.minX).toBeCloseTo(10, 6);
    expect(b.minY).toBeCloseTo(20, 6);
    expect(b.maxX).toBeCloseTo(30, 6);
    expect(b.maxY).toBeCloseTo(40, 6);
  });

  it('rotates around the origin', () => {
    const m = matrixRotate(Math.PI / 2);
    const p = transformPath(rectPath(0, 0, 10, 0), m);
    const b = polygonBounds(flattenPath(p));
    expect(b.minX).toBeCloseTo(0, 6);
    expect(b.maxY).toBeCloseTo(10, 6);
    expect(b.minY).toBeCloseTo(0, 6);
  });
});
