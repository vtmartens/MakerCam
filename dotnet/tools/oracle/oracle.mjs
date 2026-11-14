/**
 * Oracle harness: runs the original TypeScript core and writes golden fixtures
 * that the C# port is tested against.
 *
 *   node dotnet/tools/oracle/oracle.mjs
 *
 * The bundle is built in memory with esbuild, so no build output is left
 * behind apart from the fixture file.
 */
import { build } from 'esbuild';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '..', '..', '..');
const outFile = path.join(here, 'fixtures', 'oracle.json');

const entrySource = `
  // The web app runs in a browser; provide the one DOM API it needs.
  import { Window } from 'happy-dom';
  globalThis.DOMParser = new Window().DOMParser;

  import {
    rectPath, ellipsePath, flattenPath, parseSvgPathData,
  } from './src/geom';
  import { parseSvg, pathToSvgD } from './src/svg';
  import {
    DEFAULT_PARAMS, generateToolpath,
  } from './src/cam';
  import { generateGcode as emitGcode } from './src/gcode';
  import { serializeProject, parseProject } from './src/project';

  export {
    rectPath, ellipsePath, flattenPath, parseSvgPathData,
    parseSvg, pathToSvgD, DEFAULT_PARAMS, generateToolpath, emitGcode,
    serializeProject, parseProject,
  };
`;

const bundle = await build({
  stdin: { contents: entrySource, resolveDir: repoRoot, loader: 'ts' },
  bundle: true,
  platform: 'node',
  format: 'cjs',
  target: 'node16',
  write: false,
  logLevel: 'silent',
});

const bundleDir = fs.mkdtempSync(path.join(os.tmpdir(), 'makercam-oracle-'));
const bundleFile = path.join(bundleDir, 'bundle.cjs');
fs.writeFileSync(bundleFile, bundle.outputFiles[0].text, 'utf8');
let core;
try {
  core = createRequire(import.meta.url)(bundleFile);
} finally {
  fs.rmSync(bundleDir, { recursive: true, force: true });
}

/* ------------------------------------------------------------------ */
/* Fixtures                                                           */
/* ------------------------------------------------------------------ */

const P = (over = {}, unit = 'mm') => ({ ...core.DEFAULT_PARAMS(unit), ...over });

const square = (size = 100, id = 'sq') => ({ ...core.rectPath(0, 0, size, size), id });
const circle = (r = 50, id = 'c') => ({ ...core.ellipsePath(0, 0, r, r), id });

const line = (x2 = 100, id = 'l') => ({
  id,
  closed: false,
  segments: [{ kind: 'line', p1: { x: 0, y: 0 }, p2: { x: x2, y: 0 } }],
});

const bowtie = () => ({
  id: 'bow',
  closed: true,
  segments: [
    { kind: 'line', p1: { x: 0, y: 0 }, p2: { x: 10, y: 10 } },
    { kind: 'line', p1: { x: 10, y: 10 }, p2: { x: 10, y: 0 } },
    { kind: 'line', p1: { x: 10, y: 0 }, p2: { x: 0, y: 10 } },
    { kind: 'line', p1: { x: 0, y: 10 }, p2: { x: 0, y: 0 } },
  ],
});

const cases = [
  {
    name: 'svg-shapes',
    svg: `<?xml version="1.0"?>
<svg xmlns="http://www.w3.org/2000/svg" width="100mm" height="50mm" viewBox="0 0 100 50">
  <rect x="10" y="10" width="30" height="20"/>
  <circle cx="70" cy="25" r="10"/>
  <path d="M0 0 L50 0 L50 25 Z"/>
</svg>`,
  },
  {
    name: 'svg-transforms-and-use',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="100mm" height="100mm" viewBox="0 0 100 100">
  <defs><rect id="tile" x="0" y="0" width="10" height="5"/></defs>
  <g transform="translate(20 30) rotate(15 5 5)"><rect x="0" y="0" width="10" height="10"/></g>
  <rect x="0" y="0" width="10" height="10" style="transform: translate(40px, 10px)"/>
  <use href="#tile" x="70" y="80"/>
  <rect x="0" y="0" width="10" height="10" style="display:none"/>
</svg>`,
  },
  {
    name: 'svg-arcs',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="50mm" height="50mm" viewBox="0 0 50 50">
  <path id="arcs" d="M5 25 A10 5 30 0 1 25 25 C30 30 35 30 40 25 Q42 20 45 25 Z"/>
</svg>`,
  },
  {
    name: 'profile-square-outside',
    paths: [square(100, 'sq')],
    toolpath: { type: 'profile', params: P({ outside: true, toolDiameter: 10 }), pathIds: ['sq'], tolerance: 0.01 },
    gcode: { unit: 'mm', tolerance: 0.01, params: P({ stockSurface: 0, targetDepth: -5, stepdown: 5 }) },
    project: { name: 'outside cut', params: P({ toolDiameter: 10, targetDepth: -5, stepdown: 5 }) },
  },
  {
    name: 'profile-hole-with-tabs',
    paths: [
      square(100, 'o'),
      { ...core.rectPath(30, 30, 40, 40), id: 'h' },
    ],
    toolpath: {
      type: 'profile',
      params: P({ outside: true, toolDiameter: 6, tabSpacing: 30, tabWidth: 5, tabHeight: 3 }),
      pathIds: ['o', 'h'],
      tolerance: 0.01,
    },
    gcode: { unit: 'mm', tolerance: 0.01, params: P({ stockSurface: 0, targetDepth: -6, stepdown: 3 }) },
  },
  {
    name: 'pocket-square',
    paths: [square(100, 'sq')],
    toolpath: { type: 'pocket', params: P({ toolDiameter: 10, stepover: 0.4 }), pathIds: ['sq'], tolerance: 0.05 },
    gcode: { unit: 'mm', tolerance: 0.01, params: P({ stockSurface: 0, targetDepth: -8, stepdown: 4 }) },
  },
  {
    name: 'follow-circle',
    paths: [circle(50, 'c')],
    toolpath: { type: 'follow', params: P({ toolDiameter: 6 }), pathIds: ['c'], tolerance: 0.02 },
    gcode: { unit: 'mm', tolerance: 0.01, params: P({ stockSurface: 0, targetDepth: -3, stepdown: 3 }) },
  },
  {
    name: 'drill-centre',
    paths: [square(100, 'sq')],
    toolpath: { type: 'drill', params: P({ center: true }), pathIds: ['sq'], tolerance: 0.02 },
    gcode: { unit: 'mm', tolerance: 0.01, params: P({ stockSurface: 0, targetDepth: -6, stepdown: 3 }) },
  },
  {
    name: 'drill-fill',
    paths: [square(100, 'sq')],
    toolpath: { type: 'drill', params: P({ center: false, spacing: 20 }), pathIds: ['sq'], tolerance: 0.02 },
    gcode: { unit: 'mm', tolerance: 0.01, params: P({ stockSurface: 0, targetDepth: -6, stepdown: 3 }) },
  },
  {
    name: 'drillpath-line',
    paths: [line(120, 'l')],
    toolpath: { type: 'drillpath', params: P({ holeCount: 4 }), pathIds: ['l'], tolerance: 0.02 },
    gcode: { unit: 'mm', tolerance: 0.01, params: P({ stockSurface: 0, targetDepth: -6, stepdown: 3 }) },
  },
  {
    name: 'drillpath-square',
    paths: [square(100, 'sq')],
    toolpath: { type: 'drillpath', params: P({ holeCount: 5 }), pathIds: ['sq'], tolerance: 0.01 },
  },
  {
    name: 'bowtie-profile',
    paths: [bowtie()],
    toolpath: { type: 'profile', params: P({ toolDiameter: 2 }), pathIds: ['bow'], tolerance: 0.01 },
    gcode: { unit: 'mm', tolerance: 0.01, params: P({ stockSurface: 0, targetDepth: -2, stepdown: 2 }) },
  },
  {
    name: 'pocket-inches',
    paths: [square(25.4, 'sq')],
    toolpath: { type: 'pocket', params: P({ toolDiameter: 6.35, stepover: 0.4 }, 'in'), pathIds: ['sq'], tolerance: 0.05 },
    gcode: { unit: 'in', tolerance: 0.01, params: P({ stockSurface: 0, targetDepth: -12.7, stepdown: 6.35 }, 'in') },
  },
  {
    name: 'nested-profile',
    paths: [
      square(100, 'outer'),
      { ...core.rectPath(20, 20, 60, 60), id: 'hole' },
      { ...core.rectPath(35, 35, 30, 30), id: 'island' },
    ],
    toolpath: { type: 'profile', params: P({ outside: true, toolDiameter: 5 }), pathIds: ['outer', 'hole', 'island'], tolerance: 0.01 },
    gcode: { unit: 'mm', tolerance: 0.01, params: P({ stockSurface: 0, targetDepth: -5, stepdown: 5 }) },
  },
  {
    name: 'profile-rejects-open-path',
    paths: [line(100, 'l')],
    toolpath: { type: 'profile', params: P(), pathIds: ['l'], tolerance: 0.02 },
  },
  {
    name: 'project-roundtrip',
    paths: [square(100, 'sq'), circle(20, 'c')],
    project: { name: 'profile 1', params: P({ toolDiameter: 6, targetDepth: -4, stepdown: 2 }) },
    toolpath: { type: 'profile', params: P({ toolDiameter: 6 }), pathIds: ['sq', 'c'], tolerance: 0.02 },
  },
];

/* ------------------------------------------------------------------ */
/* Execution                                                          */
/* ------------------------------------------------------------------ */

function summarizePath(p) {
  return {
    id: p.id ?? null,
    name: p.name ?? null,
    sourceId: p.sourceId ?? null,
    closed: p.closed,
    points: core.flattenPath(p, 0.02).map((v) => [v.x, v.y]),
  };
}

function summarizeImport(r) {
  return {
    pathCount: r.paths.length,
    widthMm: r.widthMm,
    heightMm: r.heightMm,
    sourceWidth: r.sourceWidth,
    sourceHeight: r.sourceHeight,
    hasViewBox: r.hasViewBox,
    warnings: r.warnings,
    paths: r.paths.map(summarizePath),
  };
}

function summarizeToolpath(t) {
  return {
    loops: t.loops.map((l) => ({
      points: l.points.map((p) => [p.x, p.y]),
      depth: l.depth,
      closed: l.closed,
      pocketDepth: l.pocketDepth,
      tabs: l.tabs.map((t2) => [t2.start, t2.width, t2.height]),
      sourceId: l.sourceId ?? null,
    })),
    drillPoints: t.drillPoints.map((p) => [p.x, p.y]),
    warnings: t.warnings,
  };
}

function summarizeProject(p) {
  if (!p) return null;
  return {
    pathCount: p.paths.length,
    operations: p.operations.map((o) => ({
      id: o.id ?? null,
      type: o.type,
      name: o.name,
      params: o.params,
      pathIds: o.pathIds,
    })),
    warnings: p.warnings,
  };
}

function runCase(c) {
  const expected = {};
  let paths = c.paths ?? [];

  if (c.svg) {
    const imported = core.parseSvg(c.svg, { pxPerInch: c.pxPerInch ?? 96 });
    paths = imported.paths;
    expected.import = summarizeImport(imported);
  }

  let toolpath = null;
  if (c.toolpath) {
    const selected = c.toolpath.pathIds?.length
      ? paths.filter((p) => c.toolpath.pathIds.includes(p.id))
      : paths;
    toolpath = core.generateToolpath(
      c.toolpath.type,
      c.toolpath.params,
      selected,
      c.toolpath.tolerance ?? 0.02,
    );
    expected.toolpath = summarizeToolpath(toolpath);
  }

  if (c.gcode) {
    const op = {
      id: 'op1',
      type: c.toolpath?.type ?? 'profile',
      name: c.gcode.name ?? 'op 1',
      params: c.gcode.params,
      pathIds: [],
      loops: toolpath?.loops ?? [],
      drillPoints: toolpath?.drillPoints ?? [],
      processed: true,
      visible: true,
    };
    expected.gcode = core.emitGcode([op], c.gcode.unit ?? 'mm', c.gcode.tolerance ?? 0.01);
  }

  if (c.project) {
    const op = {
      id: 'op1',
      type: c.toolpath?.type ?? 'profile',
      name: c.project.name ?? 'profile 1',
      params: c.project.params,
      pathIds: paths.filter((p) => p.id).map((p) => p.id),
    };
    const svg = core.serializeProject(paths, [op], 'mm');
    expected.project = svg;
    expected.projectParsed = summarizeProject(core.parseProject(svg));
  }

  return {
    ...c,
    expected,
  };
}

const output = {
  version: 1,
  source: 'src/*.ts (MakerCam Modern web app)',
  cases: cases.map(runCase),
};

fs.mkdirSync(path.dirname(outFile), { recursive: true });
fs.writeFileSync(outFile, JSON.stringify(output, null, 2) + '\n', 'utf8');
console.log(`Wrote ${output.cases.length} cases to ${path.relative(repoRoot, outFile)}`);
