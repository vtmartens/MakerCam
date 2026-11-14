/**
 * SVG import.
 *
 * Parses SVG paths and basic shapes into the app's millimetre, Y-up path
 * model. Group transforms, viewBox scaling and physical units are honoured.
 */

import {
  CubicSegment,
  Matrix,
  Path,
  Segment,
  Vec,
  ellipsePath,
  matrixMultiply,
  polygonPath,
  rectPath,
  roundedRectPath,
  transformPath,
  parseSvgPathData,
  pt,
} from './geom';

export interface ImportOptions {
  /** Resolution used for CSS px and unitless SVG user units. */
  pxPerInch?: number;
  /** Flattening tolerance for the resulting CAM paths (mm). */
  tolerance?: number;
}

export interface ImportResult {
  paths: Path[];
  warnings: string[];
  widthMm: number;
  heightMm: number;
  sourceWidth: number;
  sourceHeight: number;
  hasViewBox: boolean;
}

const MM_PER_IN = 25.4;

function pxToMm(pxPerInch: number): number {
  return MM_PER_IN / pxPerInch;
}

interface LengthValue {
  value: number;
  unit: string;
}

function parseLength(s: string | null | undefined): LengthValue | null {
  if (s == null) return null;
  const m = String(s).trim().match(/^([+-]?(?:(?:\d+\.?\d*)|(?:\.\d+))(?:[eE][+-]?\d+)?)\s*([a-zA-Z%]*)$/);
  if (!m) return null;
  const value = Number(m[1]);
  if (!Number.isFinite(value)) return null;
  return { value, unit: (m[2] || '').toLowerCase() };
}

function lengthToMm(l: LengthValue | null, pxPerInch: number, percentRef = 0): number | null {
  if (!l) return null;
  const p = pxToMm(pxPerInch);
  switch (l.unit) {
    case '':
    case 'px':
      return l.value * p;
    case 'mm':
      return l.value;
    case 'cm':
      return l.value * 10;
    case 'in':
      return l.value * MM_PER_IN;
    case 'pt':
      return (l.value * MM_PER_IN) / 72;
    case 'pc':
      return (l.value * MM_PER_IN) / 6;
    case '%':
      return (l.value / 100) * percentRef;
    default:
      return l.value * p;
  }
}

/** Numeric value in SVG user units. */
function userValue(s: string | null | undefined): number | null {
  const l = parseLength(s);
  if (!l) return null;
  return l.value;
}

/* ------------------------------------------------------------------ */
/* Transforms                                                          */
/* ------------------------------------------------------------------ */

export function parseTransformList(input: string | null): Matrix {
  if (!input) return { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 };
  let result: Matrix = { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 };
  const re = /(matrix|translate|scale|rotate|skewX|skewY)\s*\(([^)]*)\)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(input))) {
    const name = m[1];
    const nums = (m[2].match(/[+-]?(?:(?:\d+\.?\d*)|(?:\.\d+))(?:[eE][+-]?\d+)?/g) || []).map(Number);
    let t: Matrix | null = null;
    switch (name) {
      case 'matrix':
        if (nums.length >= 6) t = { a: nums[0], b: nums[1], c: nums[2], d: nums[3], e: nums[4], f: nums[5] };
        break;
      case 'translate':
        t = { a: 1, b: 0, c: 0, d: 1, e: nums[0] || 0, f: nums[1] || 0 };
        break;
      case 'scale': {
        const sx = nums[0] ?? 1;
        const sy = nums[1] ?? sx;
        t = { a: sx, b: 0, c: 0, d: sy, e: 0, f: 0 };
        break;
      }
      case 'rotate': {
        const ang = ((nums[0] || 0) * Math.PI) / 180;
        const cx = nums[1] || 0;
        const cy = nums[2] || 0;
        const c = Math.cos(ang);
        const s = Math.sin(ang);
        const rot = { a: c, b: s, c: -s, d: c, e: 0, f: 0 };
        const toOrigin = { a: 1, b: 0, c: 0, d: 1, e: -cx, f: -cy };
        const back = { a: 1, b: 0, c: 0, d: 1, e: cx, f: cy };
        t = matrixMultiply(matrixMultiply(back, rot), toOrigin);
        break;
      }
      case 'skewX':
        t = { a: 1, b: 0, c: Math.tan(((nums[0] || 0) * Math.PI) / 180), d: 1, e: 0, f: 0 };
        break;
      case 'skewY':
        t = { a: 1, b: Math.tan(((nums[0] || 0) * Math.PI) / 180), c: 0, d: 1, e: 0, f: 0 };
        break;
    }
    if (t) result = matrixMultiply(result, t);
  }
  return result;
}

/* ------------------------------------------------------------------ */
/* Element conversion                                                  */
/* ------------------------------------------------------------------ */

function elementLocalName(el: Element): string {
  return (el.localName || el.nodeName || '').toLowerCase();
}

function shapeToPath(el: Element): Path | null {
  const tag = elementLocalName(el);
  const num = (name: string, fallback = 0): number => {
    const v = userValue(el.getAttribute(name));
    return v === null ? fallback : v;
  };

  switch (tag) {
    case 'path': {
      const d = el.getAttribute('d');
      if (!d) return null;
      const subs = parseSvgPathData(d);
      if (subs.length === 0) return null;
      // Multiple subpaths become multiple Paths; caller handles by returning
      // them through the `extra` channel.
      return null; // handled separately
    }
    case 'rect': {
      const x = num('x');
      const y = num('y');
      const w = num('width');
      const h = num('height');
      if (w <= 0 || h <= 0) return null;
      let rx = num('rx', NaN);
      let ry = num('ry', NaN);
      if (Number.isNaN(rx) && Number.isNaN(ry)) return rectPath(x, y, w, h);
      if (Number.isNaN(rx)) rx = ry;
      if (Number.isNaN(ry)) ry = rx;
      if (rx <= 0 || ry <= 0) return rectPath(x, y, w, h);
      const r = Math.min(rx, ry);
      return roundedRectPath(x, y, w, h, r);
    }
    case 'circle': {
      const cx = num('cx');
      const cy = num('cy');
      const r = num('r');
      if (r <= 0) return null;
      return ellipsePath(cx, cy, r, r);
    }
    case 'ellipse': {
      const cx = num('cx');
      const cy = num('cy');
      const rx = num('rx');
      const ry = num('ry');
      if (rx <= 0 || ry <= 0) return null;
      return ellipsePath(cx, cy, rx, ry);
    }
    case 'line': {
      const x1 = num('x1');
      const y1 = num('y1');
      const x2 = num('x2');
      const y2 = num('y2');
      return { closed: false, segments: [{ kind: 'line', p1: pt(x1, y1), p2: pt(x2, y2) }] };
    }
    case 'polyline':
    case 'polygon': {
      const raw = el.getAttribute('points');
      if (!raw) return null;
      const nums = (raw.match(/[+-]?(?:(?:\d+\.?\d*)|(?:\.\d+))(?:[eE][+-]?\d+)?/g) || []).map(Number);
      if (nums.length < 4) return null;
      const segments: Segment[] = [];
      let prev = pt(nums[0], nums[1]);
      const first = prev;
      for (let i = 2; i + 1 < nums.length; i += 2) {
        const p = pt(nums[i], nums[i + 1]);
        segments.push({ kind: 'line', p1: prev, p2: p });
        prev = p;
      }
      const closed = tag === 'polygon';
      if (closed) segments.push({ kind: 'line', p1: prev, p2: first });
      return { closed, segments };
    }
  }
  return null;
}

/* ------------------------------------------------------------------ */
/* Main parser                                                         */
/* ------------------------------------------------------------------ */

export function parseSvg(text: string, options: ImportOptions = {}): ImportResult {
  const pxPerInch = options.pxPerInch ?? 96;
  const warnings: string[] = [];
  const parser = new DOMParser();
  // Parsing creates an inert document. Only element names, attributes, and
  // geometry are read; the document is never inserted into the live DOM.
  const doc = parser.parseFromString(text, 'image/svg+xml');
  const parseError = doc.querySelector('parsererror');
  if (parseError) {
    throw new Error('The file is not valid SVG: ' + (parseError.textContent || '').slice(0, 200));
  }
  const root = doc.documentElement;
  if (!root || elementLocalName(root) !== 'svg') {
    throw new Error('The file does not contain an <svg> root element.');
  }

  const viewBoxAttr = root.getAttribute('viewBox');
  const viewBox = viewBoxAttr
    ? viewBoxAttr.trim().split(/[\s,]+/).map(Number)
    : null;
  const hasViewBox = !!viewBox && viewBox.length === 4 && viewBox.every((n) => Number.isFinite(n));

  const widthLen = parseLength(root.getAttribute('width'));
  const heightLen = parseLength(root.getAttribute('height'));
  const vbX = hasViewBox ? viewBox![0] : 0;
  const vbY = hasViewBox ? viewBox![1] : 0;
  const vbW = hasViewBox ? viewBox![2] : 0;
  const vbH = hasViewBox ? viewBox![3] : 0;

  let widthMm = lengthToMm(widthLen, pxPerInch) ?? 0;
  let heightMm = lengthToMm(heightLen, pxPerInch) ?? 0;

  if (hasViewBox && vbW > 0 && vbH > 0) {
    if (widthMm <= 0 && heightMm > 0) widthMm = (heightMm * vbW) / vbH;
    if (heightMm <= 0 && widthMm > 0) heightMm = (widthMm * vbH) / vbW;
    if (widthMm <= 0 && heightMm <= 0) {
      widthMm = vbW * pxToMm(pxPerInch);
      heightMm = vbH * pxToMm(pxPerInch);
    }
  } else {
    if (widthMm <= 0) widthMm = 100 * pxToMm(pxPerInch);
    if (heightMm <= 0) heightMm = 100 * pxToMm(pxPerInch);
  }

  // Root matrix: user units -> mm, Y flipped so the SVG's bottom-left is (0,0).
  let rootMatrix: Matrix;
  if (hasViewBox && vbW > 0 && vbH > 0) {
    const scaleX = widthMm / vbW;
    const scaleY = heightMm / vbH;
    const preserve = (root.getAttribute('preserveAspectRatio') || 'xMidYMid meet').trim();
    const useUniform = !preserve.startsWith('none');
    const s = useUniform ? Math.min(scaleX, scaleY) : 1;
    const sx = useUniform ? s : scaleX;
    const sy = useUniform ? s : scaleY;
    const drawnW = vbW * sx;
    const drawnH = vbH * sy;
    let offsetX = 0;
    let offsetY = 0;
    if (useUniform) {
      const align = preserve.startsWith('xMax') ? 'max' : preserve.startsWith('xMin') ? 'min' : 'mid';
      const alignY = preserve.includes('YMax') ? 'max' : preserve.includes('YMin') ? 'min' : 'mid';
      if (align === 'mid') offsetX = (widthMm - drawnW) / 2;
      else if (align === 'max') offsetX = widthMm - drawnW;
      if (alignY === 'mid') offsetY = (heightMm - drawnH) / 2;
      else if (alignY === 'max') offsetY = heightMm - drawnH;
    }
    // x' = (x - vbX)*sx + offsetX
    // y' = heightMm - ((y - vbY)*sy + offsetY)  (flip)
    rootMatrix = {
      a: sx,
      b: 0,
      c: 0,
      d: -sy,
      e: offsetX - vbX * sx,
      f: heightMm - offsetY + vbY * sy,
    };
  } else {
    const s = pxToMm(pxPerInch);
    rootMatrix = { a: s, b: 0, c: 0, d: -s, e: 0, f: heightMm };
  }

  // Build an id map for <use> support.
  const idMap = new Map<string, Element>();
  const all = root.querySelectorAll('*');
  all.forEach((el) => {
    const id = el.getAttribute('id');
    if (id) idMap.set(id, el);
  });

  const paths: Path[] = [];
  let pathCounter = 0;

  const addPath = (p: Path, m: Matrix, sourceId?: string) => {
    const transformed = transformPath(p, m);
    // Drop paths that are entirely empty.
    if (transformed.segments.length === 0) return;
    pathCounter++;
    transformed.id = `p${pathCounter}`;
    transformed.name = sourceId || transformed.name || `path ${pathCounter}`;
    transformed.sourceId = sourceId;
    paths.push(transformed);
  };

  const walk = (el: Element, parentMatrix: Matrix, depth: number, seenUse: Set<Element>) => {
    if (depth > 80) {
      warnings.push('SVG nesting is too deep; some elements were skipped.');
      return;
    }
    const tag = elementLocalName(el);
    if (['defs', 'metadata', 'title', 'desc', 'style', 'script', 'clipPath', 'mask', 'filter', 'linearGradient', 'radialGradient', 'pattern', 'marker', 'symbol'].includes(tag)) {
      return;
    }

    const styleAttr = el.getAttribute('style') || '';
    if (
      el.getAttribute('display') === 'none' ||
      /(?:^|;)\s*display\s*:\s*none\b/i.test(styleAttr) ||
      /(?:^|;)\s*visibility\s*:\s*hidden\b/i.test(styleAttr)
    ) {
      return;
    }

    let local = parseTransformList(el.getAttribute('transform'));
    const styleTransform = /(?:^|;)\s*transform\s*:\s*([^;]+)/i.exec(styleAttr);
    if (styleTransform) {
      local = matrixMultiply(local, parseTransformList(styleTransform[1]));
    }
    let matrix = matrixMultiply(parentMatrix, local);

    if (tag === 'svg' && el !== root) {
      const x = userValue(el.getAttribute('x')) ?? 0;
      const y = userValue(el.getAttribute('y')) ?? 0;
      matrix = matrixMultiply(matrix, { a: 1, b: 0, c: 0, d: 1, e: x, f: y });
    }

    if (tag === 'use') {
      const href = el.getAttribute('href') || el.getAttributeNS('http://www.w3.org/1999/xlink', 'href');
      const id = href && href.startsWith('#') ? href.slice(1) : null;
      const target = id ? idMap.get(id) : null;
      if (!target) {
        warnings.push('A <use> element references a missing shape.');
        return;
      }
      if (seenUse.has(target)) {
        warnings.push('A recursive <use> reference was skipped.');
        return;
      }
      const x = userValue(el.getAttribute('x')) ?? 0;
      const y = userValue(el.getAttribute('y')) ?? 0;
      const useMatrix = matrixMultiply(matrix, { a: 1, b: 0, c: 0, d: 1, e: x, f: y });
      const nextSeen = new Set(seenUse);
      nextSeen.add(target);
      walk(target, useMatrix, depth + 1, nextSeen);
      return;
    }

    if (tag === 'g' || tag === 'svg' || tag === 'a' || tag === 'switch') {
      const children = Array.from(el.children);
      for (const child of children) walk(child, matrix, depth + 1, seenUse);
      return;
    }

    if (tag === 'path') {
      const d = el.getAttribute('d');
      if (!d) return;
      let subs;
      try {
        subs = parseSvgPathData(d);
      } catch (e) {
        warnings.push(`Could not parse a path: ${(e as Error).message}`);
        return;
      }
      const id = el.getAttribute('id') || undefined;
      let i = 0;
      for (const sub of subs) {
        if (sub.segments.length === 0) continue;
        addPath({ segments: sub.segments, closed: sub.closed, sourceId: id }, matrix, id);
        i++;
      }
      return;
    }

    if (['rect', 'circle', 'ellipse', 'line', 'polyline', 'polygon'].includes(tag)) {
      const p = shapeToPath(el);
      if (p) addPath(p, matrix, el.getAttribute('id') || undefined);
      return;
    }

    if (tag === 'text' || tag === 'tspan') {
      warnings.push('Text elements are not converted (convert text to paths in your SVG editor).');
      return;
    }
    if (tag === 'image') {
      warnings.push('Raster images inside the SVG are ignored.');
      return;
    }
    // Unknown elements: recurse into children where possible.
    for (const child of Array.from(el.children)) walk(child, matrix, depth + 1, seenUse);
  };

  walk(root, rootMatrix, 0, new Set());

  if (paths.length === 0) {
    warnings.push('No supported geometry was found in the SVG.');
  }

  return {
    paths,
    warnings,
    widthMm,
    heightMm,
    sourceWidth: vbW || widthMm,
    sourceHeight: vbH || heightMm,
    hasViewBox,
  };
}

/* ------------------------------------------------------------------ */
/* Export helpers                                                      */
/* ------------------------------------------------------------------ */

/** Serialises one path to an SVG `d` string using the supplied point mapper. */
export function pathToSvgD(path: Path, map: (p: Vec) => Vec): string {
  if (path.segments.length === 0) return '';
  const m = (p: Vec) => {
    const q = map(p);
    return `${round(q.x)} ${round(q.y)}`;
  };
  const parts: string[] = [`M${m(path.segments[0].p1)}`];
  for (const seg of path.segments) {
    switch (seg.kind) {
      case 'line':
        parts.push(`L${m(seg.p2)}`);
        break;
      case 'quad':
        parts.push(`Q${m(seg.c)} ${m(seg.p2)}`);
        break;
      case 'cubic':
        parts.push(`C${m(seg.c1)} ${m(seg.c2)} ${m(seg.p2)}`);
        break;
    }
  }
  if (path.closed) parts.push('Z');
  return parts.join(' ');
}

function round(n: number): number {
  return Math.round(n * 10000) / 10000;
}
