import { describe, expect, it } from 'vitest';
import { parseSvg, pathToSvgD } from '../src/svg';
import { flattenPath, polygonBounds, polygonArea, matrixTranslate } from '../src/geom';
import { parseProject, serializeProject } from '../src/project';
import { DEFAULT_PARAMS, type OpDefinition } from '../src/cam';

const simpleSvg = `<?xml version="1.0"?>
<svg xmlns="http://www.w3.org/2000/svg" width="100mm" height="50mm" viewBox="0 0 100 50">
  <rect x="10" y="10" width="30" height="20"/>
  <circle cx="70" cy="25" r="10"/>
  <path d="M0 0 L50 0 L50 25 Z"/>
</svg>`;

describe('SVG import', () => {
  it('imports basic shapes with physical units', () => {
    const r = parseSvg(simpleSvg);
    expect(r.paths.length).toBe(3);
    expect(r.widthMm).toBeCloseTo(100, 6);
    expect(r.heightMm).toBeCloseTo(50, 6);
  });

  it('flips Y so the model is Y-up', () => {
    const r = parseSvg(`<svg xmlns="http://www.w3.org/2000/svg" width="100mm" height="100mm" viewBox="0 0 100 100"><rect x="0" y="0" width="100" height="100"/></svg>`);
    const b = polygonBounds(flattenPath(r.paths[0]));
    expect(b.minX).toBeCloseTo(0, 5);
    expect(b.minY).toBeCloseTo(0, 5);
    expect(b.maxX).toBeCloseTo(100, 5);
    expect(b.maxY).toBeCloseTo(100, 5);
  });

  it('applies group transforms', () => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="100mm" height="100mm" viewBox="0 0 100 100">
      <g transform="translate(20 30)"><rect x="0" y="0" width="10" height="10"/></g></svg>`;
    const r = parseSvg(svg);
    const b = polygonBounds(flattenPath(r.paths[0]));
    expect(b.minX).toBeCloseTo(20, 5);
    // SVG y=30..40 with height 100 -> model y=60..70
    expect(b.minY).toBeCloseTo(60, 5);
    expect(b.maxY).toBeCloseTo(70, 5);
  });

  it('parses polygon and polyline', () => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
      <polygon points="0,0 10,0 10,10"/>
      <polyline points="20,20 30,20 30,30"/>
    </svg>`;
    const r = parseSvg(svg);
    expect(r.paths.length).toBe(2);
    expect(r.paths[0].closed).toBe(true);
    expect(r.paths[1].closed).toBe(false);
  });

  it('ignores hidden elements and honours style transforms', () => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="100mm" height="100mm" viewBox="0 0 100 100">
      <rect x="0" y="0" width="10" height="10" style="display:none"/>
      <rect x="0" y="0" width="10" height="10" style="transform: translate(40px, 0px)"/>
    </svg>`;
    const r = parseSvg(svg);
    expect(r.paths.length).toBe(1);
    const b = polygonBounds(flattenPath(r.paths[0]));
    expect(b.minX).toBeCloseTo(40, 4);
  });

  it('warns about text elements', () => {
    const r = parseSvg(`<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><text x="1" y="1">hi</text></svg>`);
    expect(r.warnings.some((w) => /text/i.test(w))).toBe(true);
  });

  it('serialises a path back to SVG data', () => {
    const r = parseSvg(simpleSvg);
    const d = pathToSvgD(r.paths[0], (p) => p);
    expect(d.startsWith('M')).toBe(true);
    expect(d.endsWith('Z')).toBe(true);
  });
});

describe('project round-trip', () => {
  it('saves and restores paths and operations', () => {
    const imported = parseSvg(simpleSvg);
    const paths = imported.paths;
    const ops: OpDefinition[] = [
      {
        id: 'op1',
        type: 'profile',
        name: 'outside cut',
        params: { ...DEFAULT_PARAMS('mm'), toolDiameter: 6, targetDepth: -5, stepdown: 2.5 },
        pathIds: [paths[0].id!],
      },
    ];
    const svg = serializeProject(paths, ops, 'mm');
    const project = parseProject(svg);
    expect(project).not.toBeNull();
    expect(project!.paths.length).toBe(paths.length);
    expect(project!.operations.length).toBe(1);
    expect(project!.operations[0].name).toBe('outside cut');
    expect(project!.operations[0].params.toolDiameter).toBeCloseTo(6, 5);
    expect(project!.operations[0].pathIds.length).toBe(1);
    // The referenced path must exist in the restored drawing.
    const referenced = project!.paths.find((p) => p.id === project!.operations[0].pathIds[0]);
    expect(referenced).toBeDefined();
    expect(Math.abs(polygonArea(flattenPath(referenced!)))).toBeGreaterThan(0);
  });

  it('reads original PartKam/Flash metadata', () => {
    const original = `<?xml version="1.0"?>
<svg xmlns="http://www.w3.org/2000/svg" width="10in" height="10in" viewBox="0 0 720 720">
  <metadata>
    <cutobject type="profile" unit="imperial" name="profile 1" safetyheight="0.5" stocksurface="0" targetdepth="-0.75" stepdown="0.05" feedrate="60" plungerate="30" tooldiameter="0.25" roughingclearance="0" outside="true" direction="1">
      <path>path0</path>
    </cutobject>
  </metadata>
  <path id="path0" d="M100 100 L200 100 L200 200 Z"/>
</svg>`;
    const project = parseProject(original);
    expect(project).not.toBeNull();
    expect(project!.operations.length).toBe(1);
    const op = project!.operations[0];
    expect(op.type).toBe('profile');
    expect(op.params.toolDiameter).toBeCloseTo(6.35, 3);
    expect(op.params.targetDepth).toBeCloseTo(-19.05, 3);
    expect(op.params.stepdown).toBeCloseTo(1.27, 3);
    expect(op.pathIds.length).toBe(1);
  });

  it('returns null for a plain SVG without CAM metadata', () => {
    expect(parseProject(simpleSvg)).toBeNull();
  });
});
