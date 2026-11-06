import { describe, expect, it } from 'vitest';
import { generateGcode } from '../src/gcode';
import { DEFAULT_PARAMS, type Operation, type OperationParams } from '../src/cam';

function op(over: Partial<Operation> = {}, paramsOver: Partial<OperationParams> = {}): Operation {
  return {
    id: 'op1',
    type: 'profile',
    name: 'profile 1',
    params: { ...DEFAULT_PARAMS('mm'), ...paramsOver },
    pathIds: ['p1'],
    loops: [
      {
        points: [
          { x: 0, y: 0 },
          { x: 10, y: 0 },
          { x: 10, y: 10 },
          { x: 0, y: 10 },
        ],
        depth: 0,
        closed: true,
        pocketDepth: 0,
        tabs: [],
      },
    ],
    drillPoints: [],
    processed: true,
    visible: true,
    ...over,
  };
}

describe('G-code generation', () => {
  it('emits a metric preamble and footer', () => {
    const g = generateGcode([op({}, { stockSurface: 0, targetDepth: -5, stepdown: 5 })], 'mm');
    expect(g).toContain('G21 G90 G40');
    expect(g).toContain('G0 Z');
    expect(g).toContain('G1 Z-5');
    expect(g).toContain('M5');
    expect(g).toContain('M30');
    expect(g).toContain('(profile 1)');
    expect(g).toContain('(Tool 1:');
    expect(g).not.toMatch(/\bM6\b/);
  });

  it('converts coordinates and feeds to inches', () => {
    const g = generateGcode([op({}, { stockSurface: 0, targetDepth: -5, stepdown: 5, feedrate: 254 })], 'in');
    expect(g).toContain('G20 G90 G40');
    // 10 mm = 0.3937 in; 254 mm/min = 10 in/min
    expect(g).toContain('X0.3937');
    expect(g).toContain('F10');
  });

  it('emits multiple depth slices', () => {
    const g = generateGcode([op({}, { stockSurface: 0, targetDepth: -10, stepdown: 5 })], 'mm');
    expect(g).toContain('G1 Z-5');
    expect(g).toContain('G1 Z-10');
  });

  it('lifts over tabs during profile cuts', () => {
    const o = op({}, { stockSurface: 0, targetDepth: -5, stepdown: 5, tabHeight: 2 });
    o.loops[0].tabs = [{ start: 5, width: 2, height: 2 }];
    const g = generateGcode([o], 'mm');
    // Tab top = target depth (-5) + tab height (2) = -3.
    expect(g).toContain('G1 Z-3');
  });

  it('emits drill pecks', () => {
    const o = op(
      {
        type: 'drill',
        loops: [],
        drillPoints: [{ x: 5, y: 5 }],
      },
      { stockSurface: 0, targetDepth: -6, stepdown: 3 },
    );
    const g = generateGcode([o], 'mm');
    expect(g).toContain('G0 X5 Y5');
    expect(g).toContain('G1 Z-3');
    expect(g).toContain('G1 Z-6');
  });

  it('emits a drill cycle for holes along a path', () => {
    const o = op(
      {
        type: 'drillpath',
        loops: [],
        drillPoints: [
          { x: 5, y: 5 },
          { x: 25, y: 5 },
        ],
      },
      { stockSurface: 0, targetDepth: -6, stepdown: 3 },
    );
    const g = generateGcode([o], 'mm');
    expect(g).toContain('(profile 1)');
    expect(g).toContain('G0 X5 Y5');
    expect(g).toContain('G0 X25 Y5');
    expect(g).toContain('G1 Z-3');
    expect(g).toContain('G1 Z-6');
  });

  it('emits GRBL-compatible manual tool changes', () => {
    const a = op({ id: 'a', name: 'big' }, { toolDiameter: 10, stockSurface: 0, targetDepth: -2, stepdown: 2 });
    const b = op({ id: 'b', name: 'small' }, { toolDiameter: 3, stockSurface: 0, targetDepth: -2, stepdown: 2 });
    const g = generateGcode([a, b], 'mm');
    // GRBL rejects M6, so tools are selected by a comment and a pause instead.
    expect(g).not.toMatch(/\bM6\b/);
    expect(g).not.toMatch(/^T\d/m);
    expect(g).toContain('(Tool 1: 10 mm)');
    expect(g).toContain('(Tool 2: 3 mm - change tool, then resume)');
    expect(g.indexOf('(Tool 1:')).toBeLessThan(g.indexOf('(Tool 2:'));
    expect(g.indexOf('(Tool 2:')).toBeLessThan(g.indexOf('M0'));
  });
});
