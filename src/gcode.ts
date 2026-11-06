/**
 * G-code post-processor.
 *
 * The output is GRBL-compatible: a G20/G21 preamble, one manual tool-change
 * pause per distinct cutter, profiles cut in depth slices, pockets cut level by
 * level, and peck drilling. GRBL has no automatic tool changer, so it rejects
 * the original `T.. M6` command; tool changes are emitted as an M0 pause with a
 * comment instead.
 */

import { Vec, dist } from './geom';
import { Loop, Operation, Unit } from './cam';

const LINE_END = '\r\n';

export interface GcodeOptions {
  unit: Unit; // output units
  tolerance: number; // mm
  header?: string;
}

function decimalsFor(unit: Unit, tolerance: number): number {
  const tolInUnit = unit === 'mm' ? tolerance : tolerance / 25.4;
  // One digit finer than the requested tolerance, clamped to sane bounds.
  const digits = Math.ceil(-Math.log10(Math.max(tolInUnit, 1e-6))) + 1;
  return Math.max(2, Math.min(6, digits));
}

function formatNumber(n: number, decimals: number): string {
  if (!Number.isFinite(n)) return '0';
  let s = n.toFixed(decimals);
  if (s.includes('.')) s = s.replace(/0+$/, '').replace(/\.$/, '');
  if (s === '-0') s = '0';
  return s;
}

function convertLength(mm: number, unit: Unit): number {
  return unit === 'in' ? mm / 25.4 : mm;
}

function fmtLength(mm: number, unit: Unit, decimals: number): string {
  return formatNumber(convertLength(mm, unit), decimals);
}

function commentSafe(name: string): string {
  return name.replace(/[()\r\n]/g, ' ').trim();
}

function toolList(ops: Operation[]): number[] {
  const tools: number[] = [];
  for (const op of ops) {
    if (!tools.some((t) => Math.abs(t - op.params.toolDiameter) < 1e-9)) {
      tools.push(op.params.toolDiameter);
    }
  }
  tools.sort((a, b) => b - a);
  return tools;
}

interface EmitState {
  lines: string[];
  unit: Unit;
  decimals: number;
  feedDecimals: number;
  currentTool: number;
  cutterOn: boolean;
}

function emit(s: EmitState, line: string): void {
  s.lines.push(line + LINE_END);
}

function toolComment(s: EmitState, tool: number, op: Operation): string {
  const unitLabel = s.unit === 'in' ? 'in' : 'mm';
  return `Tool ${tool + 1}: ${fmtLength(op.params.toolDiameter, s.unit, s.decimals)} ${unitLabel}`;
}

function ensureTool(s: EmitState, op: Operation, tools: number[]): void {
  const tool = tools.findIndex((t) => Math.abs(t - op.params.toolDiameter) < 1e-9);
  if (tool !== s.currentTool) {
    if (s.currentTool >= 0) {
      // GRBL has no automatic tool changer: stop the spindle, pause for the
      // manual change, then resume and restart it with the new cutter.
      if (s.cutterOn) {
        emit(s, 'M5');
        s.cutterOn = false;
      }
      emit(s, `(${toolComment(s, tool, op)} - change tool, then resume)`);
      emit(s, 'M0');
    } else {
      emit(s, `(${toolComment(s, tool, op)})`);
    }
    s.currentTool = tool;
  }
  if (!s.cutterOn) {
    emit(s, 'G17');
    emit(s, 'M3');
    s.cutterOn = true;
  }
}

function moveTo(s: EmitState, p: Vec, docx: number, docy: number, withFeed?: number): void {
  const x = fmtLength(p.x + docx, s.unit, s.decimals);
  const y = fmtLength(p.y - docy, s.unit, s.decimals);
  let line = `G1 X${x} Y${y}`;
  if (withFeed !== undefined) {
    line += ` F${formatNumber(convertLength(withFeed, s.unit), s.feedDecimals)}`;
  }
  emit(s, line);
}

function rapidTo(s: EmitState, p: Vec, docx: number, docy: number): void {
  const x = fmtLength(p.x + docx, s.unit, s.decimals);
  const y = fmtLength(p.y - docy, s.unit, s.decimals);
  emit(s, `G0 X${x} Y${y}`);
}

function plungTo(s: EmitState, zMm: number, plunge: number): void {
  const z = fmtLength(zMm, s.unit, s.decimals);
  emit(s, `G1 Z${z} F${formatNumber(convertLength(plunge, s.unit), s.feedDecimals)}`);
}

/**
 * Emits the moves for one closed loop at a given Z, inserting tab lifts.
 * Returns nothing; appends lines to the emitter.
 */
function emitLoop(
  s: EmitState,
  loop: Loop,
  depth: number,
  targetDepth: number,
  feedrate: number,
  plungerate: number,
  docx: number,
  docy: number,
): void {
  const pts = loop.points;
  if (pts.length === 0) return;

  const tabTop = targetDepth;
  const activeTabs = loop.tabs
    .filter((t) => t.height > 0)
    .map((t) => ({ start: t.start, end: t.start + t.width, top: targetDepth + t.height }))
    .filter((t) => t.top > depth + 1e-9)
    .sort((a, b) => a.start - b.start);

  let feedPending = true;
  let zState = depth; // current Z (mm)

  const doMove = (to: Vec) => {
    moveTo(s, to, docx, docy, feedPending ? feedrate : undefined);
    feedPending = false;
  };

  const setZ = (z: number) => {
    if (Math.abs(z - zState) > 1e-9) {
      plungTo(s, z, plungerate);
      zState = z;
      feedPending = true;
    }
  };

  if (!loop.closed) {
    for (let i = 1; i < pts.length; i++) doMove(pts[i]);
    return;
  }

  // Closed loop: walk the perimeter, splitting at tab boundaries.
  const n = pts.length;
  const lengths: number[] = [];
  let total = 0;
  for (let i = 0; i < n; i++) {
    const l = dist(pts[i], pts[(i + 1) % n]);
    lengths.push(l);
    total += l;
  }

  // If the loop starts inside a tab, lift immediately.
  const startTab = activeTabs.find((t) => t.start <= 1e-9 && t.end > 1e-9);
  if (startTab) setZ(startTab.top);

  let sPos = 0;
  for (let i = 0; i < n; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % n];
    const segLen = lengths[i];
    const segStart = sPos;
    const segEnd = sPos + segLen;
    sPos = segEnd;

    // Gather split points inside this edge.
    const cuts: { at: number; kind: 'enter' | 'exit' }[] = [];
    for (const tab of activeTabs) {
      if (tab.start > segStart + 1e-9 && tab.start < segEnd - 1e-9) {
        cuts.push({ at: (tab.start - segStart) / segLen, kind: 'enter' });
      }
      if (tab.end > segStart + 1e-9 && tab.end < segEnd - 1e-9) {
        cuts.push({ at: (tab.end - segStart) / segLen, kind: 'exit' });
      }
      // Tab starts exactly at this edge's start.
      if (Math.abs(tab.start - segStart) < 1e-9) {
        cuts.push({ at: 0, kind: 'enter' });
      }
      if (Math.abs(tab.end - segStart) < 1e-9) {
        cuts.push({ at: 0, kind: 'exit' });
      }
    }
    cuts.sort((x, y) => x.at - y.at || (x.kind === 'enter' ? -1 : 1));

    let last = a;
    const tabAt = (pos: number) => activeTabs.find((t) => pos >= t.start - 1e-9 && pos < t.end - 1e-9);
    for (const cut of cuts) {
      const p = cut.at <= 1e-9 ? a : cut.at >= 1 - 1e-9 ? b : {
        x: a.x + (b.x - a.x) * cut.at,
        y: a.y + (b.y - a.y) * cut.at,
      };
      if (dist(last, p) > 1e-9) doMove(p);
      if (cut.kind === 'enter') setZ(tabAt(segStart + cut.at * segLen)?.top ?? tabTop);
      else setZ(depth);
      last = p;
    }
    // Move to the end of the edge.
    if (dist(last, b) > 1e-9 || i === n - 1) doMove(b);
  }

  // Ensure we finish at the loop start.
  if (dist(pts[n - 1], pts[0]) > 1e-9) {
    // The closing edge already ended at pts[0] because of the modulo.
  }
  setZ(depth);
}

function processProfile(s: EmitState, op: Operation, tools: number[]): void {
  const p = op.params;
  if (op.loops.length === 0) return;
  emit(s, `(${commentSafe(op.name)})`);

  for (const loop of op.loops) {
    if (loop.points.length < 2) continue;
    emit(s, `G0 Z${fmtLength(p.safetyHeight, s.unit, s.decimals)}`);
    ensureTool(s, op, tools);
    rapidTo(s, loop.points[0], 0, 0);

    let depth = p.stockSurface;
    while (depth > p.targetDepth + 1e-9) {
      depth = Math.max(p.targetDepth, depth - Math.abs(p.stepdown));
      depth = Number(depth.toFixed(6));
      plungTo(s, depth, p.plungerate);
      emitLoop(s, loop, depth, p.targetDepth, p.feedrate, p.plungerate, 0, 0);
    }
  }
}

function processPocket(s: EmitState, op: Operation, tools: number[]): void {
  const p = op.params;
  if (op.loops.length === 0) return;
  emit(s, `(${commentSafe(op.name)})`);

  let depth = p.stockSurface;
  while (depth > p.targetDepth + 1e-9) {
    depth = Math.max(p.targetDepth, depth - Math.abs(p.stepdown));
    depth = Number(depth.toFixed(6));

    for (const loop of op.loops) {
      if (loop.points.length < 2) continue;
      emit(s, `G0 Z${fmtLength(p.safetyHeight, s.unit, s.decimals)}`);
      ensureTool(s, op, tools);
      rapidTo(s, loop.points[0], 0, 0);
      plungTo(s, depth, p.plungerate);
      emitLoop(s, loop, depth, p.targetDepth, p.feedrate, p.plungerate, 0, 0);
    }
  }
}

function processFollow(s: EmitState, op: Operation, tools: number[]): void {
  const p = op.params;
  if (op.loops.length === 0) return;
  emit(s, `(${commentSafe(op.name)})`);

  for (const loop of op.loops) {
    if (loop.points.length < 2) continue;
    let depth = p.stockSurface;
    while (depth > p.targetDepth + 1e-9) {
      depth = Math.max(p.targetDepth, depth - Math.abs(p.stepdown));
      depth = Number(depth.toFixed(6));
      emit(s, `G0 Z${fmtLength(p.safetyHeight, s.unit, s.decimals)}`);
      ensureTool(s, op, tools);
      rapidTo(s, loop.points[0], 0, 0);
      plungTo(s, depth, p.plungerate);
      emitLoop(s, loop, depth, p.targetDepth, p.feedrate, p.plungerate, 0, 0);
    }
  }
}

function processDrill(s: EmitState, op: Operation, tools: number[]): void {
  const p = op.params;
  if (op.drillPoints.length === 0) return;
  emit(s, `(${commentSafe(op.name)})`);

  for (const point of op.drillPoints) {
    emit(s, `G0 Z${fmtLength(p.safetyHeight, s.unit, s.decimals)}`);
    ensureTool(s, op, tools);
    rapidTo(s, point, 0, 0);
    let depth = p.stockSurface;
    while (depth > p.targetDepth + 1e-9) {
      depth = Math.max(p.targetDepth, depth - Math.abs(p.stepdown));
      depth = Number(depth.toFixed(6));
      plungTo(s, depth, p.plungerate);
      // Peck: retract to the stock surface between passes.
      emit(s, `G1 Z${fmtLength(p.stockSurface, s.unit, s.decimals)} F${formatNumber(convertLength(p.plungerate, s.unit), s.feedDecimals)}`);
    }
  }
}

export function generateGcode(ops: Operation[], unit: Unit, tolerance = 0.01): string {
  const processed = ops.filter((op) => op.processed);
  if (processed.length === 0) return '';

  const tools = toolList(processed);
  const s: EmitState = {
    lines: [],
    unit,
    decimals: decimalsFor(unit, tolerance),
    feedDecimals: unit === 'in' ? 3 : 1,
    currentTool: -1,
    cutterOn: false,
  };

  emit(s, '(Generated by MakerCam Modern, a port of PartKam by Jack Clark)');
  emit(s, unit === 'in' ? 'G20 G90 G40' : 'G21 G90 G40');
  emit(s, '');

  for (const op of processed) {
    switch (op.type) {
      case 'profile':
        processProfile(s, op, tools);
        break;
      case 'pocket':
        processPocket(s, op, tools);
        break;
      case 'follow':
        processFollow(s, op, tools);
        break;
      case 'drill':
      case 'drillpath':
        processDrill(s, op, tools);
        break;
    }
  }

  const lastSafety = processed.length > 0 ? processed[processed.length - 1].params.safetyHeight : 10;
  emit(s, `G0 Z${fmtLength(lastSafety, s.unit, s.decimals)}`);
  emit(s, 'M5');
  emit(s, 'M30');
  return s.lines.join('');
}

/** Returns a rough machining-time estimate in minutes. */
export function estimateTime(op: Operation): number {
  const p = op.params;
  let length = 0;
  for (const loop of op.loops) {
    length += loop.points.reduce((sum, pt, i) => {
      if (!loop.closed && i === 0) return sum;
      return sum + dist(pt, loop.points[(i + 1) % loop.points.length]);
    }, 0);
  }
  if (op.type === 'drill' || op.type === 'drillpath') {
    const depth = Math.abs(p.targetDepth - p.stockSurface);
    const pecks = Math.max(1, Math.ceil(depth / Math.abs(p.stepdown || 1)));
    const perHole = pecks * 2 * depth;
    return (op.drillPoints.length * perHole) / Math.max(p.plungerate, 1);
  }
  const depth = Math.abs(p.targetDepth - p.stockSurface);
  const slices = Math.max(1, Math.ceil(depth / Math.abs(p.stepdown || 1)));
  const feed = Math.max(p.feedrate, 1);
  return (length * slices) / feed + (slices * Math.max(1, op.loops.length) * 2 * p.safetyHeight) / 2000;
}
