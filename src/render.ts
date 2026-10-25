/**
 * Canvas renderer.
 *
 * World coordinates are millimetres with Y up. Screen coordinates are CSS
 * pixels with Y down.
 */

import {
  Bounds,
  Path,
  Vec,
  dist,
  flattenPath,
  polygonBounds,
} from './geom';
import { Loop, Operation, OperationType, Unit } from './cam';

export interface View {
  /** Screen position (CSS px) of world origin. */
  panX: number;
  panY: number;
  /** Screen pixels per millimetre. */
  zoom: number;
}

export type Tool = 'select' | 'pan' | 'pen';

export interface RenderOptions {
  paths: Path[];
  operations: Operation[];
  selection: Set<string>;
  selectedOperationId: string | null;
  view: View;
  unit: Unit;
  grid: boolean;
  showToolpaths: boolean;
  showToolDiameter: boolean;
  hoverPathId: string | null;
  rubberBand: { x1: number; y1: number; x2: number; y2: number } | null;
  penPreview: Vec[] | null;
  penCursor: Vec | null;
  tool: Tool;
}

export function worldToScreen(view: View, p: Vec): Vec {
  return { x: view.panX + p.x * view.zoom, y: view.panY - p.y * view.zoom };
}

export function screenToWorld(view: View, p: Vec): Vec {
  return { x: (p.x - view.panX) / view.zoom, y: (view.panY - p.y) / view.zoom };
}

export function fitView(bounds: Bounds, width: number, height: number, margin = 48): View {
  const w = Math.max(bounds.maxX - bounds.minX, 1e-3);
  const h = Math.max(bounds.maxY - bounds.minY, 1e-3);
  const zoom = Math.min((width - margin * 2) / w, (height - margin * 2) / h);
  const cx = (bounds.minX + bounds.maxX) / 2;
  const cy = (bounds.minY + bounds.maxY) / 2;
  return {
    zoom,
    panX: width / 2 - cx * zoom,
    panY: height / 2 + cy * zoom,
  };
}

const COLORS = {
  bg: '#fafaf7',
  gridMinor: '#ecece4',
  gridMajor: '#dcdcd0',
  axis: '#c2c2b4',
  path: '#343d49',
  pathHover: '#1d6fb8',
  pathSelected: '#0a84ff',
  pathReferenced: '#8a97a6',
  profile: '#12824c',
  pocket: '#c77c08',
  follow: '#7c3aed',
  drill: '#d62828',
  drillpath: '#be185d',
  selected: '#0a84ff',
  arrow: '#ffffff',
  tab: '#0f766e',
};

function opColor(type: OperationType): string {
  switch (type) {
    case 'profile':
      return COLORS.profile;
    case 'pocket':
      return COLORS.pocket;
    case 'follow':
      return COLORS.follow;
    case 'drill':
      return COLORS.drill;
    case 'drillpath':
      return COLORS.drillpath;
  }
}

function mapPoint(view: View, p: Vec): Vec {
  return worldToScreen(view, p);
}

function drawPath(ctx: CanvasRenderingContext2D, path: Path, view: View): void {
  if (path.segments.length === 0) return;
  ctx.beginPath();
  let p1 = mapPoint(view, path.segments[0].p1);
  ctx.moveTo(p1.x, p1.y);
  for (const seg of path.segments) {
    const start = mapPoint(view, seg.p1);
    if (Math.abs(start.x - p1.x) > 1e-6 || Math.abs(start.y - p1.y) > 1e-6) {
      ctx.moveTo(start.x, start.y);
    }
    switch (seg.kind) {
      case 'line': {
        const p2 = mapPoint(view, seg.p2);
        ctx.lineTo(p2.x, p2.y);
        p1 = p2;
        break;
      }
      case 'quad': {
        const c = mapPoint(view, seg.c);
        const p2 = mapPoint(view, seg.p2);
        ctx.quadraticCurveTo(c.x, c.y, p2.x, p2.y);
        p1 = p2;
        break;
      }
      case 'cubic': {
        const c1 = mapPoint(view, seg.c1);
        const c2 = mapPoint(view, seg.c2);
        const p2 = mapPoint(view, seg.p2);
        ctx.bezierCurveTo(c1.x, c1.y, c2.x, c2.y, p2.x, p2.y);
        p1 = p2;
        break;
      }
    }
  }
  if (path.closed) ctx.closePath();
}

function drawGrid(ctx: CanvasRenderingContext2D, view: View, width: number, height: number, unit: Unit): void {
  // Choose a grid step that stays readable at any zoom.
  const baseMm = unit === 'in' ? 25.4 : 1;
  const targetPx = 14;
  let step = baseMm;
  const mult = [1, 2, 5, 10];
  let guard = 0;
  while (step * view.zoom < targetPx && guard++ < 40) {
    const decade = Math.pow(10, Math.floor(Math.log10(step / baseMm)));
    const idx = mult.findIndex((m) => Math.abs(m * decade * baseMm - step) < 1e-9);
    const next = idx >= 0 && idx < mult.length - 1 ? mult[idx + 1] * decade * baseMm : step * 2;
    step = next;
  }
  while (step * view.zoom > targetPx * 12 && guard++ < 40) {
    step /= 2;
  }
  const majorEvery = unit === 'in' ? 10 : 10;
  const worldLeft = (0 - view.panX) / view.zoom;
  const worldRight = (width - view.panX) / view.zoom;
  const worldBottom = (view.panY - height) / view.zoom;
  const worldTop = view.panY / view.zoom;

  ctx.lineWidth = 1;
  // Minor lines
  ctx.strokeStyle = COLORS.gridMinor;
  ctx.beginPath();
  const startX = Math.ceil(worldLeft / step) * step;
  for (let x = startX; x <= worldRight; x += step) {
    const sx = Math.round(view.panX + x * view.zoom) + 0.5;
    ctx.moveTo(sx, 0);
    ctx.lineTo(sx, height);
  }
  const startY = Math.ceil(worldBottom / step) * step;
  for (let y = startY; y <= worldTop; y += step) {
    const sy = Math.round(view.panY - y * view.zoom) + 0.5;
    ctx.moveTo(0, sy);
    ctx.lineTo(width, sy);
  }
  ctx.stroke();

  // Major lines
  const major = step * majorEvery;
  ctx.strokeStyle = COLORS.gridMajor;
  ctx.beginPath();
  const startXM = Math.ceil(worldLeft / major) * major;
  for (let x = startXM; x <= worldRight; x += major) {
    const sx = Math.round(view.panX + x * view.zoom) + 0.5;
    ctx.moveTo(sx, 0);
    ctx.lineTo(sx, height);
  }
  const startYM = Math.ceil(worldBottom / major) * major;
  for (let y = startYM; y <= worldTop; y += major) {
    const sy = Math.round(view.panY - y * view.zoom) + 0.5;
    ctx.moveTo(0, sy);
    ctx.lineTo(width, sy);
  }
  ctx.stroke();

  // Axes
  ctx.strokeStyle = COLORS.axis;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  const axisX = Math.round(view.panX) + 0.5;
  const axisY = Math.round(view.panY) + 0.5;
  if (axisX >= 0 && axisX <= width) {
    ctx.moveTo(axisX, 0);
    ctx.lineTo(axisX, height);
  }
  if (axisY >= 0 && axisY <= height) {
    ctx.moveTo(0, axisY);
    ctx.lineTo(width, axisY);
  }
  ctx.stroke();

  // Grid labels in the display unit.
  const worldPerUnit = unit === 'in' ? 25.4 : 1;
  ctx.fillStyle = '#8b8b7d';
  ctx.font = '11px system-ui, sans-serif';
  ctx.textBaseline = 'top';
  const labelEvery = major * 2;
  const labelStartX = Math.ceil(worldLeft / labelEvery) * labelEvery;
  for (let x = labelStartX; x <= worldRight; x += labelEvery) {
    const sx = view.panX + x * view.zoom;
    if (sx < 24 || sx > width - 24) continue;
    ctx.fillText(fmtCoord(x / worldPerUnit), sx + 3, Math.min(Math.max(axisY + 3, 3), height - 16));
  }
  const labelStartY = Math.ceil(worldBottom / labelEvery) * labelEvery;
  for (let y = labelStartY; y <= worldTop; y += labelEvery) {
    const sy = view.panY - y * view.zoom;
    if (sy < 14 || sy > height - 14) continue;
    ctx.fillText(fmtCoord(y / worldPerUnit), Math.min(Math.max(axisX + 4, 4), width - 40), sy + 2);
  }
}

function fmtCoord(n: number): string {
  const v = Math.abs(n) < 1e-9 ? 0 : n;
  return Number.isInteger(v) ? String(v) : v.toFixed(2);
}

function drawLoop(ctx: CanvasRenderingContext2D, loop: Loop, view: View): void {
  if (loop.points.length === 0) return;
  ctx.beginPath();
  const first = mapPoint(view, loop.points[0]);
  ctx.moveTo(first.x, first.y);
  for (let i = 1; i < loop.points.length; i++) {
    const p = mapPoint(view, loop.points[i]);
    ctx.lineTo(p.x, p.y);
  }
  if (loop.closed) ctx.closePath();
  ctx.stroke();
}

function drawDirectionArrows(
  ctx: CanvasRenderingContext2D,
  loop: Loop,
  view: View,
  color: string,
  everyPx = 90,
): void {
  const pts = loop.points;
  if (pts.length < 2) return;
  let travelled = 0;
  let nextArrow = 0;
  for (let i = 0; i < pts.length - (loop.closed ? 0 : 1); i++) {
    const a = pts[i];
    const b = pts[(i + 1) % pts.length];
    const segLen = dist(a, b) * view.zoom;
    if (travelled + segLen >= nextArrow && segLen > 1) {
      const t = segLen > 0 ? Math.min(1, (nextArrow - travelled) / segLen) : 0;
      const p = { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
      const dir = { x: b.x - a.x, y: b.y - a.y };
      const len = Math.hypot(dir.x, dir.y) || 1;
      const ux = dir.x / len;
      const uy = dir.y / len;
      const s = mapPoint(view, p);
      const size = 5;
      ctx.beginPath();
      ctx.moveTo(s.x + ux * size, s.y - uy * size);
      ctx.lineTo(s.x - uy * size * 0.6, s.y - ux * size * 0.6);
      ctx.lineTo(s.x + uy * size * 0.6, s.y + ux * size * 0.6);
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();
      nextArrow += everyPx;
    }
    travelled += segLen;
  }
}

function drawTabMarks(ctx: CanvasRenderingContext2D, loop: Loop, view: View): void {
  if (!loop.tabs || loop.tabs.length === 0) return;
  const pts = loop.points;
  const n = pts.length;
  if (n < 2) return;
  const lengths: number[] = [];
  let total = 0;
  for (let i = 0; i < n; i++) {
    const l = dist(pts[i], pts[(i + 1) % n]);
    lengths.push(l);
    total += l;
  }
  for (const tab of loop.tabs) {
    const center = tab.start + tab.width / 2;
    let acc = 0;
    for (let i = 0; i < n; i++) {
      if (acc <= center && center <= acc + lengths[i]) {
        const t = lengths[i] > 0 ? (center - acc) / lengths[i] : 0;
        const a = pts[i];
        const b = pts[(i + 1) % n];
        const p = { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
        const s = mapPoint(view, p);
        const dir = { x: b.x - a.x, y: b.y - a.y };
        const len = Math.hypot(dir.x, dir.y) || 1;
        const nx = -dir.y / len;
        const ny = dir.x / len;
        const size = 6;
        ctx.beginPath();
        ctx.moveTo(s.x - nx * size, s.y + ny * size);
        ctx.lineTo(s.x + nx * size, s.y - ny * size);
        ctx.strokeStyle = COLORS.tab;
        ctx.lineWidth = 2.5;
        ctx.stroke();
        break;
      }
      acc += lengths[i];
    }
  }
}

export function render(canvas: HTMLCanvasElement, opts: RenderOptions): void {
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  const w = Math.max(1, Math.round(rect.width));
  const h = Math.max(1, Math.round(rect.height));
  if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
  }
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = COLORS.bg;
  ctx.fillRect(0, 0, w, h);

  if (opts.grid) drawGrid(ctx, opts.view, w, h, opts.unit);

  // Paths referenced by the selected operation get a subtle highlight.
  const referenced = new Set<string>();
  const selectedOp = opts.operations.find((o) => o.id === opts.selectedOperationId);
  if (selectedOp) {
    for (const id of selectedOp.pathIds) referenced.add(id);
  }

  // Drawing paths
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  for (const path of opts.paths) {
    const isSelected = !!path.id && opts.selection.has(path.id);
    const isHover = path.id === opts.hoverPathId;
    const isReferenced = !!path.id && referenced.has(path.id);
    drawPath(ctx, path, opts.view);
    ctx.lineWidth = isSelected ? 2.4 : 1.6;
    ctx.strokeStyle = isSelected
      ? COLORS.pathSelected
      : isHover
        ? COLORS.pathHover
        : isReferenced
          ? COLORS.pathReferenced
          : COLORS.path;
    ctx.stroke();

    // Endpoint dots for selected paths.
    if (isSelected) {
      ctx.fillStyle = COLORS.pathSelected;
      for (const seg of path.segments) {
        const p = mapPoint(opts.view, seg.p1);
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2.6, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  // Toolpaths
  if (opts.showToolpaths) {
    for (const op of opts.operations) {
      if (!op.visible || !op.processed) continue;
      const color = opColor(op.type);
      const isSel = op.id === opts.selectedOperationId;

      if (op.loops.length > 0) {
        for (const loop of op.loops) {
          // Tool diameter ghost
          if (opts.showToolDiameter && op.params.toolDiameter > 0) {
            drawLoop(ctx, loop, opts.view);
            ctx.lineWidth = Math.max(1, op.params.toolDiameter * opts.view.zoom);
            ctx.strokeStyle = color;
            ctx.globalAlpha = isSel ? 0.18 : 0.1;
            ctx.stroke();
            ctx.globalAlpha = 1;
          }
          drawLoop(ctx, loop, opts.view);
          ctx.lineWidth = isSel ? 2.6 : 1.8;
          ctx.strokeStyle = color;
          ctx.stroke();
          if (isSel) {
            drawDirectionArrows(ctx, loop, opts.view, color);
            drawTabMarks(ctx, loop, opts.view);
          }
          // Start marker
          if (loop.points.length > 0) {
            const s = mapPoint(opts.view, loop.points[0]);
            ctx.beginPath();
            ctx.arc(s.x, s.y, isSel ? 4 : 3, 0, Math.PI * 2);
            ctx.fillStyle = isSel ? color : '#ffffff';
            ctx.fill();
            ctx.strokeStyle = color;
            ctx.lineWidth = 1.5;
            ctx.stroke();
          }
        }
      }

      if (op.drillPoints.length > 0) {
        for (const p of op.drillPoints) {
          const s = mapPoint(opts.view, p);
          const r = Math.max(2, (op.params.toolDiameter / 2) * opts.view.zoom);
          ctx.beginPath();
          ctx.arc(s.x, s.y, r, 0, Math.PI * 2);
          ctx.fillStyle = color;
          ctx.globalAlpha = isSel ? 0.35 : 0.2;
          ctx.fill();
          ctx.globalAlpha = 1;
          ctx.strokeStyle = color;
          ctx.lineWidth = isSel ? 2 : 1.4;
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(s.x - r * 0.5, s.y);
          ctx.lineTo(s.x + r * 0.5, s.y);
          ctx.moveTo(s.x, s.y - r * 0.5);
          ctx.lineTo(s.x, s.y + r * 0.5);
          ctx.stroke();
        }
      }
    }
  }

  // Pen preview
  if (opts.penPreview && opts.penPreview.length > 0) {
    ctx.beginPath();
    const first = mapPoint(opts.view, opts.penPreview[0]);
    ctx.moveTo(first.x, first.y);
    for (let i = 1; i < opts.penPreview.length; i++) {
      const p = mapPoint(opts.view, opts.penPreview[i]);
      ctx.lineTo(p.x, p.y);
    }
    if (opts.penCursor) {
      const p = mapPoint(opts.view, opts.penCursor);
      ctx.lineTo(p.x, p.y);
    }
    ctx.strokeStyle = '#0a84ff';
    ctx.lineWidth = 1.8;
    ctx.setLineDash([5, 4]);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#0a84ff';
    for (const pt of opts.penPreview) {
      const p = mapPoint(opts.view, pt);
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Rubber band
  if (opts.rubberBand) {
    const { x1, y1, x2, y2 } = opts.rubberBand;
    const x = Math.min(x1, x2);
    const y = Math.min(y1, y2);
    const rw = Math.abs(x2 - x1);
    const rh = Math.abs(y2 - y1);
    ctx.fillStyle = 'rgba(10,132,255,0.12)';
    ctx.strokeStyle = 'rgba(10,132,255,0.8)';
    ctx.lineWidth = 1;
    ctx.fillRect(x, y, rw, rh);
    ctx.strokeRect(x + 0.5, y + 0.5, rw, rh);
  }
}

/** Returns the world bounds of all drawing paths, or null. */
export function contentBounds(paths: Path[]): Bounds | null {
  let b: Bounds | null = null;
  for (const path of paths) {
    const pts = flattenPath(path, 0.05);
    if (pts.length === 0) continue;
    const pb = polygonBounds(pts);
    if (!b) b = pb;
    else {
      b.minX = Math.min(b.minX, pb.minX);
      b.minY = Math.min(b.minY, pb.minY);
      b.maxX = Math.max(b.maxX, pb.maxX);
      b.maxY = Math.max(b.maxY, pb.maxY);
    }
  }
  return b;
}
