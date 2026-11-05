/**
 * MakerCam Modern - application controller.
 *
 * A TypeScript/Canvas port of PartKam / MakerCam (ActionScript 3, circa 2010)
 * by Jack Clark. This file wires the drawing model, CAM engine, renderer and
 * UI together.
 */

import {
  Bounds,
  Matrix,
  Path,
  Vec,
  clonePath,
  closePathGap,
  closedPolygon,
  dist,
  distanceToPolyline,
  ellipsePath,
  flattenPath,
  isClosedPath,
  joinOpenPaths,
  matrixMultiply,
  matrixRotate,
  matrixScale,
  matrixTranslate,
  pathCentroid,
  polygonArea,
  polygonBounds,
  polygonPath,
  pt,
  rectPath,
  roundedRectPath,
  starPath,
  transformPath,
} from './geom';
import {
  DEFAULT_PARAMS,
  Direction,
  Loop,
  NestItem,
  Operation,
  OperationParams,
  OperationType,
  Unit,
  generateToolpath,
  nestItems,
  offsetRegion,
  toolpathBounds,
} from './cam';
import { generateGcode, estimateTime } from './gcode';
import { parseSvg } from './svg';
import { EXAMPLE_SVG } from './sample';
import { parseProject, serializeProject, downloadText, ProjectData } from './project';
import {
  View,
  Tool,
  contentBounds,
  fitView,
  render,
  screenToWorld,
  worldToScreen,
} from './render';
import {
  DialogField,
  DialogValues,
  confirmDialog,
  initMenus,
  openDialog,
  setActiveToolButton,
  showError,
  showToast,
} from './ui';

const APP_NAME = 'MakerCam Modern';
const PREFS_KEY = 'makercam-modern-prefs-v1';
const UNDO_LIMIT = 40;

interface Snapshot {
  paths: Path[];
  operations: Operation[];
  selection: string[];
  selectedOperationId: string | null;
}

type DragState =
  | { kind: 'pan'; startScreen: Vec; startPan: Vec }
  | { kind: 'band'; startScreen: Vec; additive: boolean }
  | { kind: 'move'; startWorld: Vec; originals: Path[]; ids: string[]; moved: boolean }
  | null;

interface Prefs {
  unit: Unit;
  pxPerInch: number;
  tolerance: number;
  grid: boolean;
  snap: boolean;
  showToolpaths: boolean;
  showToolDiameter: boolean;
}

const TYPE_LABEL: Record<OperationType, string> = {
  profile: 'Profile',
  pocket: 'Pocket',
  follow: 'Follow path',
  drill: 'Drill',
  drillpath: 'Holes along path',
};

const TYPE_COLOR: Record<OperationType, string> = {
  profile: '#12824c',
  pocket: '#c77c08',
  follow: '#7c3aed',
  drill: '#d62828',
  drillpath: '#be185d',
};

function cloneJSON<T>(v: T): T {
  return JSON.parse(JSON.stringify(v)) as T;
}

function convexHull(points: Vec[]): Vec[] {
  if (points.length <= 3) return points.slice();
  const pts = points
    .slice()
    .sort((a, b) => (a.x === b.x ? a.y - b.y : a.x - b.x));
  const cross = (o: Vec, a: Vec, b: Vec) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
  const lower: Vec[] = [];
  for (const p of pts) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) lower.pop();
    lower.push(p);
  }
  const upper: Vec[] = [];
  for (let i = pts.length - 1; i >= 0; i--) {
    const p = pts[i];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) upper.pop();
    upper.push(p);
  }
  lower.pop();
  upper.pop();
  return lower.concat(upper);
}

function boundsUnion(a: Bounds | null, b: Bounds): Bounds {
  if (!a) return { ...b };
  return {
    minX: Math.min(a.minX, b.minX),
    minY: Math.min(a.minY, b.minY),
    maxX: Math.max(a.maxX, b.maxX),
    maxY: Math.max(a.maxY, b.maxY),
  };
}

class App {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private fileInput: HTMLInputElement;

  paths: Path[] = [];
  operations: Operation[] = [];
  selection = new Set<string>();
  selectedOperationId: string | null = null;

  unit: Unit = 'mm';
  pxPerInch = 96;
  tolerance = 0.02;

  view: View = { panX: 0, panY: 400, zoom: 4 };
  tool: Tool = 'select';
  grid = true;
  snap = false;
  showToolpaths = true;
  showToolDiameter = false;

  private hoverPathId: string | null = null;
  private drag: DragState = null;
  private pendingSnapshot: Snapshot | null = null;
  private rubberBand: { x1: number; y1: number; x2: number; y2: number } | null = null;

  private penPoints: Vec[] = [];
  private penCursor: Vec | null = null;
  private spaceDown = false;
  private lastPointerScreen: Vec = { x: 0, y: 0 };
  private lastWorld: Vec = { x: 0, y: 0 };

  private undoStack: Snapshot[] = [];
  private redoStack: Snapshot[] = [];
  private clipboard: Path[] = [];
  private flattenCache = new WeakMap<Path, Vec[]>();

  private nextPathId = 1;
  private nextOperationId = 1;
  private nestBoundaryId: string | null = null;

  private renderQueued = false;
  private initialized = false;

  constructor() {
    const canvas = document.getElementById('canvas') as HTMLCanvasElement | null;
    if (!canvas) throw new Error('Canvas element not found');
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('2D canvas context unavailable');
    this.ctx = ctx;
    this.fileInput = document.getElementById('file-input') as HTMLInputElement;

    this.loadPrefs();
    this.bindUI();
    this.bindCanvas();
    this.bindKeyboard();
    this.bindFileInput();

    this.updateToolButtons();
    this.renderOperations();
    this.updateEmptyState();
    this.updateStatus();

    this.initialized = true;
    // Development/automation hook. Harmless in normal use and useful for
    // scripted browser checks.
    (window as unknown as { makercam: App }).makercam = this;

    // Deep link: index.html?example=1 opens the bundled demo project.
    const exampleParam = new URLSearchParams(window.location.search).get('example');
    const openExample = exampleParam === '1' || exampleParam === '';

    requestAnimationFrame(() => {
      this.fit();
      this.requestRender();
      if (openExample) this.loadExample();
    });
  }

  /* ------------------------------------------------------------------ */
  /* Persistence of preferences                                          */
  /* ------------------------------------------------------------------ */

  private loadPrefs(): void {
    try {
      const raw = localStorage.getItem(PREFS_KEY);
      if (!raw) return;
      const p = JSON.parse(raw) as Partial<Prefs>;
      if (p.unit === 'mm' || p.unit === 'in') this.unit = p.unit;
      if (typeof p.pxPerInch === 'number') this.pxPerInch = p.pxPerInch;
      if (typeof p.tolerance === 'number') this.tolerance = p.tolerance;
      if (typeof p.grid === 'boolean') this.grid = p.grid;
      if (typeof p.snap === 'boolean') this.snap = p.snap;
      if (typeof p.showToolpaths === 'boolean') this.showToolpaths = p.showToolpaths;
      if (typeof p.showToolDiameter === 'boolean') this.showToolDiameter = p.showToolDiameter;
    } catch {
      /* ignore */
    }
  }

  private savePrefs(): void {
    try {
      const p: Prefs = {
        unit: this.unit,
        pxPerInch: this.pxPerInch,
        tolerance: this.tolerance,
        grid: this.grid,
        snap: this.snap,
        showToolpaths: this.showToolpaths,
        showToolDiameter: this.showToolDiameter,
      };
      localStorage.setItem(PREFS_KEY, JSON.stringify(p));
    } catch {
      /* ignore */
    }
  }

  /* ------------------------------------------------------------------ */
  /* Unit helpers                                                        */
  /* ------------------------------------------------------------------ */

  private toDisplay(mm: number): number {
    return this.unit === 'in' ? mm / 25.4 : mm;
  }

  private fromDisplay(value: number): number {
    return this.unit === 'in' ? value * 25.4 : value;
  }

  private unitLabel(): string {
    return this.unit;
  }

  private fmtLen(mm: number, digits = 2): string {
    return this.toDisplay(mm).toFixed(digits);
  }

  /* ------------------------------------------------------------------ */
  /* UI wiring                                                           */
  /* ------------------------------------------------------------------ */

  private bindUI(): void {
    initMenus((cmd) => {
      void this.handleCommand(cmd);
    });

    for (const btn of Array.from(document.querySelectorAll<HTMLButtonElement>('[data-tool]'))) {
      btn.addEventListener('click', () => this.setTool(btn.dataset.tool as Tool));
    }

    const bind = (id: string, fn: () => void) => {
      document.getElementById(id)?.addEventListener('click', fn);
    };

    bind('btn-fit', () => this.fit());
    bind('btn-zoom-in', () => this.zoomAtCenter(1.2));
    bind('btn-zoom-out', () => this.zoomAtCenter(1 / 1.2));
    bind('btn-grid', () => this.toggleGrid());
    bind('btn-snap', () => this.toggleSnap());
    bind('btn-show-toolpaths', () => this.toggleToolpaths());
    bind('btn-show-diameter', () => this.toggleToolDiameter());
    bind('btn-add-op', () => this.addOperationDialog());
    bind('btn-export', () => this.exportGcodeDialog());
    bind('btn-empty-import', () => this.fileInput.click());
    bind('btn-empty-shape', () => this.insertShapeDialog());
    bind('btn-empty-example', () => this.loadExample());
    bind('btn-sidebar', () => {
      document.querySelector('.sidebar')?.classList.toggle('open');
    });

    const unitSelect = document.getElementById('unit-select') as HTMLSelectElement | null;
    if (unitSelect) {
      unitSelect.value = this.unit;
      unitSelect.addEventListener('change', () => {
        this.unit = unitSelect.value as Unit;
        this.savePrefs();
        this.updateStatus();
        this.renderOperations();
        this.requestRender();
        showToast(`Display units: ${this.unit === 'mm' ? 'millimetres' : 'inches'}`, 'info', 2500);
      });
    }

    window.addEventListener('resize', () => this.requestRender());
    window.addEventListener('beforeunload', () => this.savePrefs());
  }

  private bindCanvas(): void {
    this.canvas.addEventListener('pointerdown', (e) => this.onPointerDown(e));
    this.canvas.addEventListener('pointermove', (e) => this.onPointerMove(e));
    this.canvas.addEventListener('pointerup', (e) => this.onPointerUp(e));
    this.canvas.addEventListener('pointercancel', (e) => this.onPointerUp(e));
    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    this.canvas.addEventListener(
      'wheel',
      (e) => {
        e.preventDefault();
        const p = this.canvasPoint(e);
        const factor = e.deltaY < 0 ? 1.12 : 1 / 1.12;
        this.zoomAt(p, factor);
      },
      { passive: false },
    );
    this.canvas.addEventListener('dblclick', (e) => {
      if (this.tool === 'pen') {
        e.preventDefault();
        this.finishPen(false);
      }
    });

    // Drag and drop SVG files.
    const wrap = document.getElementById('canvas-wrap')!;
    wrap.addEventListener('dragover', (e) => {
      e.preventDefault();
      wrap.classList.add('drag-over');
    });
    wrap.addEventListener('dragleave', () => wrap.classList.remove('drag-over'));
    wrap.addEventListener('drop', (e) => {
      e.preventDefault();
      wrap.classList.remove('drag-over');
      const file = e.dataTransfer?.files?.[0];
      if (file) void this.readFile(file);
    });
  }

  private bindFileInput(): void {
    this.fileInput.addEventListener('change', () => {
      const file = this.fileInput.files?.[0];
      if (file) void this.readFile(file);
      this.fileInput.value = '';
    });
  }

  private bindKeyboard(): void {
    window.addEventListener('keydown', (e) => {
      const target = e.target as HTMLElement | null;
      const typing =
        !!target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable);
      const modal = !!document.querySelector('.modal-overlay');
      if (typing || modal) {
        if (e.key === 'Escape' && !modal) {
          target?.blur();
        }
        return;
      }

      if (e.key === ' ') {
        if (!this.spaceDown) {
          this.spaceDown = true;
          this.canvas.classList.add('cursor-grab');
        }
        e.preventDefault();
        return;
      }

      const ctrl = e.ctrlKey || e.metaKey;
      if (ctrl && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault();
        this.undo();
        return;
      }
      if (ctrl && (e.key.toLowerCase() === 'y' || (e.key.toLowerCase() === 'z' && e.shiftKey))) {
        e.preventDefault();
        this.redo();
        return;
      }
      if (ctrl && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        this.selectAll();
        return;
      }
      if (ctrl && e.key.toLowerCase() === 'c') {
        e.preventDefault();
        this.copySelection();
        return;
      }
      if (ctrl && e.key.toLowerCase() === 'v') {
        e.preventDefault();
        this.pasteSelection();
        return;
      }
      if (ctrl && e.key.toLowerCase() === 's') {
        e.preventDefault();
        this.saveProject();
        return;
      }
      if (ctrl && e.key.toLowerCase() === 'e') {
        e.preventDefault();
        this.exportGcodeDialog();
        return;
      }
      if (ctrl && e.key.toLowerCase() === 'o') {
        e.preventDefault();
        this.fileInput.click();
        return;
      }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        this.deleteSelection();
        return;
      }
      if (e.key === 'Escape') {
        if (this.penPoints.length > 0) {
          this.cancelPen();
        } else if (this.drag) {
          this.endDrag();
        }
        return;
      }
      if (e.key === 'Enter' && this.tool === 'pen') {
        e.preventDefault();
        this.finishPen(false);
        return;
      }
      if (!ctrl) {
        switch (e.key.toLowerCase()) {
          case 'v':
            this.setTool('select');
            break;
          case 'h':
            this.setTool('pan');
            break;
          case 'p':
            this.setTool('pen');
            break;
          case 'f':
            this.fit();
            break;
          case 'g':
            this.toggleGrid();
            break;
          case '+':
          case '=':
            this.zoomAtCenter(1.2);
            break;
          case '-':
          case '_':
            this.zoomAtCenter(1 / 1.2);
            break;
        }
      }
    });

    window.addEventListener('keyup', (e) => {
      if (e.key === ' ') {
        this.spaceDown = false;
        this.canvas.classList.remove('cursor-grab');
        this.updateCursor();
      }
    });
  }

  /* ------------------------------------------------------------------ */
  /* Pointer interaction                                                 */
  /* ------------------------------------------------------------------ */

  private canvasPoint(e: PointerEvent | WheelEvent): Vec {
    const r = this.canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  private worldPoint(e: PointerEvent): Vec {
    const w = screenToWorld(this.view, this.canvasPoint(e));
    return this.snap ? this.applySnap(w) : w;
  }

  private applySnap(p: Vec): Vec {
    const step = this.unit === 'in' ? 2.54 : 1;
    return { x: Math.round(p.x / step) * step, y: Math.round(p.y / step) * step };
  }

  private flatPath(path: Path): Vec[] {
    let pts = this.flattenCache.get(path);
    if (!pts) {
      pts = flattenPath(path, 0.2);
      this.flattenCache.set(path, pts);
    }
    return pts;
  }

  private hitPath(world: Vec): Path | null {
    const tol = 7 / this.view.zoom;
    let best: Path | null = null;
    let bestD = tol;
    for (const path of this.paths) {
      const pts = this.flatPath(path);
      const d = distanceToPolyline(world, pts, isClosedPath(path));
      if (d < bestD) {
        bestD = d;
        best = path;
      }
    }
    return best;
  }

  private hitOperation(world: Vec): Operation | null {
    const tol = 7 / this.view.zoom;
    let best: Operation | null = null;
    let bestD = tol;
    for (const op of this.operations) {
      if (!op.visible || !op.processed) continue;
      for (const loop of op.loops) {
        const d = distanceToPolyline(world, loop.points, loop.closed);
        if (d < bestD) {
          bestD = d;
          best = op;
        }
      }
      for (const p of op.drillPoints) {
        const d = dist(world, p);
        if (d < bestD) {
          bestD = d;
          best = op;
        }
      }
    }
    return best;
  }

  private onPointerDown(e: PointerEvent): void {
    if (window.innerWidth <= 820) {
      document.querySelector('.sidebar')?.classList.remove('open');
    }
    this.canvas.setPointerCapture(e.pointerId);
    const screen = this.canvasPoint(e);
    this.lastPointerScreen = screen;
    const world = this.worldPoint(e);
    this.lastWorld = world;
    this.updateStatusCoords(world);

    // Middle / right button, Space, or the pan tool pans the view.
    if (e.button === 1 || e.button === 2 || this.spaceDown || this.tool === 'pan') {
      e.preventDefault();
      this.drag = {
        kind: 'pan',
        startScreen: screen,
        startPan: { x: this.view.panX, y: this.view.panY },
      };
      this.canvas.classList.add('cursor-grabbing');
      return;
    }

    if (e.button !== 0) return;

    if (this.tool === 'pen') {
      this.penPointerDown(world);
      return;
    }

    if (this.tool === 'select') {
      const path = this.hitPath(world);
      if (path && path.id) {
        const additive = e.shiftKey;
        if (additive) {
          if (this.selection.has(path.id)) this.selection.delete(path.id);
          else this.selection.add(path.id);
          this.selectedOperationId = null;
          this.updateSelectionUI();
          this.requestRender();
          return;
        }
        if (!this.selection.has(path.id)) {
          this.selection.clear();
          this.selection.add(path.id);
        }
        this.selectedOperationId = null;
        this.updateSelectionUI();
        this.pendingSnapshot = this.snapshot();
        const originals = this.paths
          .filter((p) => p.id && this.selection.has(p.id))
          .map((p) => clonePath(p));
        this.drag = {
          kind: 'move',
          startWorld: world,
          originals,
          ids: originals.map((p) => p.id!).filter(Boolean),
          moved: false,
        };
        this.canvas.classList.add('cursor-move');
        this.requestRender();
        return;
      }

      const op = this.hitOperation(world);
      if (op) {
        this.selectedOperationId = op.id;
        this.updateSelectionUI();
        this.renderOperations();
        this.requestRender();
        return;
      }

      if (!e.shiftKey) {
        this.selection.clear();
        this.selectedOperationId = null;
        this.updateSelectionUI();
      }
      this.drag = { kind: 'band', startScreen: screen, additive: e.shiftKey };
      this.rubberBand = { x1: screen.x, y1: screen.y, x2: screen.x, y2: screen.y };
      this.requestRender();
    }
  }

  private onPointerMove(e: PointerEvent): void {
    const screen = this.canvasPoint(e);
    const world = this.worldPoint(e);
    this.lastPointerScreen = screen;
    this.lastWorld = world;
    this.updateStatusCoords(world);

    if (!this.drag) {
      if (this.tool === 'pen') {
        this.penCursor = world;
        this.requestRender();
        return;
      }
      if (this.tool === 'select') {
        const path = this.hitPath(world);
        const op = path ? null : this.hitOperation(world);
        const newHover = path?.id ?? null;
        if (newHover !== this.hoverPathId) {
          this.hoverPathId = newHover;
          this.requestRender();
        }
        this.updateCursor();
        if (op) this.canvas.classList.add('cursor-move');
      }
      return;
    }

    if (this.drag.kind === 'pan') {
      this.view.panX = this.drag.startPan.x + (screen.x - this.drag.startScreen.x);
      this.view.panY = this.drag.startPan.y + (screen.y - this.drag.startScreen.y);
      this.requestRender();
      return;
    }

    if (this.drag.kind === 'band') {
      this.rubberBand = {
        x1: this.drag.startScreen.x,
        y1: this.drag.startScreen.y,
        x2: screen.x,
        y2: screen.y,
      };
      this.requestRender();
      return;
    }

    if (this.drag.kind === 'move') {
      const dx = world.x - this.drag.startWorld.x;
      const dy = world.y - this.drag.startWorld.y;
      if (!this.drag.moved && Math.hypot(dx, dy) * this.view.zoom > 2) {
        this.drag.moved = true;
      }
      if (!this.drag.moved) return;
      const byId = new Map(this.drag.originals.map((p) => [p.id!, p]));
      for (const id of this.drag.ids) {
        const original = byId.get(id);
        if (!original) continue;
        const index = this.paths.findIndex((p) => p.id === id);
        if (index < 0) continue;
        this.paths[index] = transformPath(original, matrixTranslate(dx, dy));
      }
      this.requestRender();
      this.updateStatus();
    }
  }

  private onPointerUp(e: PointerEvent): void {
    if (this.canvas.hasPointerCapture(e.pointerId)) this.canvas.releasePointerCapture(e.pointerId);
    if (!this.drag) return;

    if (this.drag.kind === 'band') {
      this.finishBand();
      return;
    }

    if (this.drag.kind === 'move') {
      const moved = this.drag.moved;
      const snapshot = this.pendingSnapshot;
      this.endDrag();
      if (moved) {
        if (snapshot) this.pushUndoSnapshot(snapshot);
        this.regenerateAll(true);
      }
      return;
    }

    this.endDrag();
  }

  private endDrag(): void {
    this.drag = null;
    this.rubberBand = null;
    this.pendingSnapshot = null;
    this.canvas.classList.remove('cursor-grabbing', 'cursor-move');
    this.updateCursor();
    this.requestRender();
  }

  private finishBand(): void {
    if (!this.rubberBand) {
      this.endDrag();
      return;
    }
    const a = screenToWorld(this.view, { x: this.rubberBand.x1, y: this.rubberBand.y1 });
    const b = screenToWorld(this.view, { x: this.rubberBand.x2, y: this.rubberBand.y2 });
    const rect = {
      minX: Math.min(a.x, b.x),
      maxX: Math.max(a.x, b.x),
      minY: Math.min(a.y, b.y),
      maxY: Math.max(a.y, b.y),
    };
    const additive = this.drag?.kind === 'band' ? this.drag.additive : false;
    if (!additive) this.selection.clear();
    if (rect.maxX - rect.minX > 1e-6 || rect.maxY - rect.minY > 1e-6) {
      for (const path of this.paths) {
        if (!path.id) continue;
        const pts = this.flatPath(path);
        const bb = polygonBounds(pts);
        const intersects =
          bb.maxX >= rect.minX && bb.minX <= rect.maxX && bb.maxY >= rect.minY && bb.minY <= rect.maxY;
        if (intersects) this.selection.add(path.id);
      }
    }
    this.selectedOperationId = null;
    this.endDrag();
    this.updateSelectionUI();
    this.requestRender();
  }

  private updateCursor(): void {
    this.canvas.classList.remove('cursor-move', 'cursor-grab', 'cursor-grabbing', 'cursor-crosshair');
    if (this.spaceDown || this.tool === 'pan') {
      this.canvas.classList.add('cursor-grab');
    } else if (this.tool === 'pen') {
      this.canvas.classList.add('cursor-crosshair');
    } else if (this.hoverPathId) {
      this.canvas.classList.add('cursor-move');
    }
  }

  /* ------------------------------------------------------------------ */
  /* Pen tool                                                            */
  /* ------------------------------------------------------------------ */

  private penPointerDown(world: Vec): void {
    if (this.penPoints.length >= 3) {
      const first = this.penPoints[0];
      if (dist(world, first) * this.view.zoom < 10) {
        this.finishPen(true);
        return;
      }
    }
    const last = this.penPoints[this.penPoints.length - 1];
    if (last && dist(last, world) < 1e-6) return;
    this.penPoints.push(world);
    this.penCursor = world;
    this.updateHint('Click to add points. Click the first point to close, Enter to finish, Esc to cancel.');
    this.requestRender();
  }

  private finishPen(closed: boolean): void {
    if (this.penPoints.length < 2) {
      this.cancelPen();
      return;
    }
    const points = this.penPoints.slice();
    const segments = [];
    for (let i = 1; i < points.length; i++) {
      segments.push({ kind: 'line' as const, p1: points[i - 1], p2: points[i] });
    }
    if (closed) segments.push({ kind: 'line' as const, p1: points[points.length - 1], p2: points[0] });
    this.pushUndo();
    const path: Path = { segments, closed, id: this.newPathId(), name: 'Pen path' };
    this.paths.push(path);
    this.selection.clear();
    this.selection.add(path.id!);
    this.selectedOperationId = null;
    this.penPoints = [];
    this.penCursor = null;
    this.updateSelectionUI();
    this.updateEmptyState();
    this.updateHint('Path added.');
    this.requestRender();
  }

  private cancelPen(): void {
    this.penPoints = [];
    this.penCursor = null;
    this.updateHint('Pen cancelled.');
    this.requestRender();
  }

  /* ------------------------------------------------------------------ */
  /* Navigation                                                          */
  /* ------------------------------------------------------------------ */

  private zoomAt(screen: Vec, factor: number): void {
    const before = screenToWorld(this.view, screen);
    const minZoom = 0.05;
    const maxZoom = 400;
    const zoom = Math.min(maxZoom, Math.max(minZoom, this.view.zoom * factor));
    if (Math.abs(zoom - this.view.zoom) < 1e-9) return;
    this.view.zoom = zoom;
    this.view.panX = screen.x - before.x * zoom;
    this.view.panY = screen.y + before.y * zoom;
    this.updateStatus();
    this.requestRender();
  }

  private zoomAtCenter(factor: number): void {
    const rect = this.canvas.getBoundingClientRect();
    this.zoomAt({ x: rect.width / 2, y: rect.height / 2 }, factor);
  }

  fit(): void {
    const rect = this.canvas.getBoundingClientRect();
    const b = contentBounds(this.paths);
    if (!b) {
      this.view = { panX: rect.width / 2, panY: rect.height / 2, zoom: 4 };
    } else {
      this.view = fitView(b, rect.width, rect.height, 64);
      this.view.zoom = Math.min(400, Math.max(0.05, this.view.zoom));
    }
    this.updateStatus();
    this.requestRender();
  }

  private fitToSelection(): void {
    const selected = this.paths.filter((p) => p.id && this.selection.has(p.id));
    if (selected.length === 0) {
      this.fit();
      return;
    }
    const b = contentBounds(selected);
    if (!b) {
      this.fit();
      return;
    }
    const rect = this.canvas.getBoundingClientRect();
    this.view = fitView(b, rect.width, rect.height, 64);
    this.requestRender();
  }

  /* ------------------------------------------------------------------ */
  /* Rendering                                                           */
  /* ------------------------------------------------------------------ */

  requestRender(): void {
    if (this.renderQueued) return;
    this.renderQueued = true;
    requestAnimationFrame(() => {
      this.renderQueued = false;
      this.renderNow();
    });
  }

  private renderNow(): void {
    render(this.canvas, {
      paths: this.paths,
      operations: this.operations,
      selection: this.selection,
      selectedOperationId: this.selectedOperationId,
      view: this.view,
      unit: this.unit,
      grid: this.grid,
      showToolpaths: this.showToolpaths,
      showToolDiameter: this.showToolDiameter,
      hoverPathId: this.hoverPathId,
      rubberBand: this.rubberBand,
      penPreview: this.penPoints.length > 0 ? this.penPoints : null,
      penCursor: this.penCursor,
      tool: this.tool,
    });
    this.updateEmptyState();
  }

  private updateEmptyState(): void {
    const el = document.getElementById('empty-state');
    if (!el) return;
    el.classList.toggle('hidden', this.paths.length > 0);
  }

  private updateStatus(): void {
    const zoomPercent = Math.round((this.view.zoom / (96 / 25.4)) * 100);
    const zoomEl = document.getElementById('status-zoom');
    if (zoomEl) zoomEl.textContent = `${zoomPercent}%`;
    const selEl = document.getElementById('status-selection');
    if (selEl) {
      const n = this.selection.size;
      selEl.textContent = `${n} path${n === 1 ? '' : 's'} selected`;
    }
    this.updateStatusCoords(this.lastWorld);
  }

  private updateStatusCoords(world: Vec): void {
    const el = document.getElementById('status-coords');
    if (!el) return;
    const d = this.unit === 'in' ? 3 : 2;
    el.textContent = `X ${this.toDisplay(world.x).toFixed(d)} Y ${this.toDisplay(world.y).toFixed(d)} ${this.unit}`;
  }

  private updateHint(text: string): void {
    const el = document.getElementById('status-hint');
    if (el) el.textContent = text;
  }

  private updateSelectionUI(): void {
    this.updateStatus();
    this.renderOperations();
    this.requestRender();
  }

  /* ------------------------------------------------------------------ */
  /* Tools and toggles                                                   */
  /* ------------------------------------------------------------------ */

  private setTool(tool: Tool): void {
    if (this.tool === 'pen' && tool !== 'pen') this.cancelPen();
    this.tool = tool;
    this.updateToolButtons();
    this.updateCursor();
    if (tool === 'select') this.updateHint('Select paths. Shift-click to add; drag to move; drag empty space to marquee.');
    else if (tool === 'pan') this.updateHint('Drag to pan. Wheel to zoom.');
    else this.updateHint('Click to draw. Click the first point to close, Enter to finish, Esc to cancel.');
    this.requestRender();
  }

  private updateToolButtons(): void {
    setActiveToolButton(this.tool);
  }

  private toggleGrid(): void {
    this.grid = !this.grid;
    const btn = document.getElementById('btn-grid');
    btn?.classList.toggle('active', this.grid);
    btn?.setAttribute('aria-pressed', String(this.grid));
    this.savePrefs();
    this.requestRender();
  }

  private toggleSnap(): void {
    this.snap = !this.snap;
    const btn = document.getElementById('btn-snap');
    btn?.classList.toggle('active', this.snap);
    btn?.setAttribute('aria-pressed', String(this.snap));
    this.savePrefs();
    showToast(this.snap ? 'Snap to grid enabled' : 'Snap to grid disabled', 'info', 2000);
  }

  private toggleToolpaths(): void {
    this.showToolpaths = !this.showToolpaths;
    const btn = document.getElementById('btn-show-toolpaths');
    btn?.classList.toggle('active', this.showToolpaths);
    btn?.setAttribute('aria-pressed', String(this.showToolpaths));
    this.savePrefs();
    this.requestRender();
  }

  private toggleToolDiameter(): void {
    this.showToolDiameter = !this.showToolDiameter;
    const btn = document.getElementById('btn-show-diameter');
    btn?.classList.toggle('active', this.showToolDiameter);
    btn?.setAttribute('aria-pressed', String(this.showToolDiameter));
    this.savePrefs();
    this.requestRender();
  }

  /* ------------------------------------------------------------------ */
  /* Undo / redo                                                         */
  /* ------------------------------------------------------------------ */

  private snapshot(): Snapshot {
    return {
      paths: cloneJSON(this.paths),
      operations: cloneJSON(this.operations),
      selection: Array.from(this.selection),
      selectedOperationId: this.selectedOperationId,
    };
  }

  private pushUndo(): void {
    this.pushUndoSnapshot(this.snapshot());
  }

  private pushUndoSnapshot(s: Snapshot): void {
    this.undoStack.push(s);
    if (this.undoStack.length > UNDO_LIMIT) this.undoStack.shift();
    this.redoStack = [];
  }

  private restore(s: Snapshot): void {
    this.paths = cloneJSON(s.paths);
    this.operations = cloneJSON(s.operations);
    this.selection = new Set(s.selection);
    this.selectedOperationId = s.selectedOperationId;
    this.hoverPathId = null;
    this.rubberBand = null;
    this.updateSelectionUI();
    this.updateEmptyState();
    this.requestRender();
  }

  private undo(): void {
    const s = this.undoStack.pop();
    if (!s) {
      showToast('Nothing to undo', 'info', 1800);
      return;
    }
    this.redoStack.push(this.snapshot());
    this.restore(s);
    showToast('Undo', 'info', 1200);
  }

  private redo(): void {
    const s = this.redoStack.pop();
    if (!s) {
      showToast('Nothing to redo', 'info', 1800);
      return;
    }
    this.undoStack.push(this.snapshot());
    this.restore(s);
    showToast('Redo', 'info', 1200);
  }

  /* ------------------------------------------------------------------ */
  /* Selection helpers                                                   */
  /* ------------------------------------------------------------------ */

  private selectAll(): void {
    this.selection = new Set(this.paths.map((p) => p.id!).filter(Boolean));
    this.selectedOperationId = null;
    this.updateSelectionUI();
  }

  private copySelection(): void {
    const selected = this.paths.filter((p) => p.id && this.selection.has(p.id));
    if (selected.length === 0) {
      showToast('Select one or more paths to copy', 'info', 2200);
      return;
    }
    this.clipboard = selected.map(clonePath);
    showToast(`Copied ${selected.length} path${selected.length === 1 ? '' : 's'}`, 'success', 1800);
  }

  private pasteSelection(): void {
    if (this.clipboard.length === 0) {
      showToast('Clipboard is empty', 'info', 1800);
      return;
    }
    this.pushUndo();
    const offset = matrixTranslate(10, -10);
    this.selection.clear();
    for (const p of this.clipboard) {
      const copy = transformPath(clonePath(p), offset);
      copy.id = this.newPathId();
      copy.name = p.name ? `${p.name} copy` : 'Copy';
      this.paths.push(copy);
      this.selection.add(copy.id);
    }
    this.selectedOperationId = null;
    this.updateSelectionUI();
    this.updateEmptyState();
    showToast(`Pasted ${this.clipboard.length} path${this.clipboard.length === 1 ? '' : 's'}`, 'success', 1800);
  }

  private deleteSelection(): void {
    if (this.selection.size === 0) return;
    this.pushUndo();
    const ids = new Set(this.selection);
    this.paths = this.paths.filter((p) => !p.id || !ids.has(p.id));
    const removedOps: string[] = [];
    this.operations = this.operations.filter((op) => {
      op.pathIds = op.pathIds.filter((id) => !ids.has(id));
      if (op.pathIds.length === 0) {
        removedOps.push(op.id);
        return false;
      }
      return true;
    });
    if (this.selectedOperationId && removedOps.includes(this.selectedOperationId)) {
      this.selectedOperationId = null;
    }
    this.selection.clear();
    this.regenerateAll(true);
    this.updateSelectionUI();
    this.updateEmptyState();
    this.requestRender();
  }

  /* ------------------------------------------------------------------ */
  /* IDs and path helpers                                                */
  /* ------------------------------------------------------------------ */

  private newPathId(): string {
    let id = `p${this.nextPathId++}`;
    while (this.paths.some((p) => p.id === id)) id = `p${this.nextPathId++}`;
    return id;
  }

  private newOperationId(): string {
    let id = `op${this.nextOperationId++}`;
    while (this.operations.some((o) => o.id === id)) id = `op${this.nextOperationId++}`;
    return id;
  }

  private ensurePathIds(paths: Path[]): void {
    for (const p of paths) {
      if (!p.id) p.id = this.newPathId();
      else {
        const n = /^p(\d+)$/.exec(p.id);
        if (n) this.nextPathId = Math.max(this.nextPathId, Number(n[1]) + 1);
      }
    }
    // Repair duplicates.
    const seen = new Set<string>();
    for (const p of paths) {
      if (!p.id || seen.has(p.id)) p.id = this.newPathId();
      seen.add(p.id);
    }
  }

  private selectedPaths(): Path[] {
    return this.paths.filter((p) => p.id && this.selection.has(p.id));
  }

  private pathsForOperation(op: Operation): Path[] {
    const ids = new Set(op.pathIds);
    return this.paths.filter((p) => p.id && ids.has(p.id));
  }

  /* ------------------------------------------------------------------ */
  /* Operations                                                          */
  /* ------------------------------------------------------------------ */

  private regenerateOperation(op: Operation): string[] {
    const paths = this.pathsForOperation(op);
    if (paths.length === 0) {
      op.loops = [];
      op.drillPoints = [];
      op.processed = false;
      return ['The operation has no drawing paths left.'];
    }
    const result = generateToolpath(op.type, op.params, paths, this.tolerance);
    op.loops = result.loops;
    op.drillPoints = result.drillPoints;
    op.processed = result.loops.length > 0 || result.drillPoints.length > 0;
    return result.warnings;
  }

  regenerateAll(silent = false): void {
    const warnings: string[] = [];
    for (const op of this.operations) {
      for (const w of this.regenerateOperation(op)) warnings.push(`${op.name}: ${w}`);
    }
    this.renderOperations();
    this.requestRender();
    if (!silent && warnings.length > 0) {
      showToast(warnings.slice(0, 3).join(' '), 'warning', 7000);
    }
  }

  private addOperationDialog(): void {
    if (this.paths.length === 0) {
      showToast('Import a drawing first', 'info', 2200);
      return;
    }
    void openDialog({
      title: 'Add toolpath',
      description: 'Choose the type of CAM operation to create for the selected paths.',
      fields: [
        {
          key: 'type',
          label: 'Operation',
          type: 'select',
          value: 'profile',
          options: [
            { label: 'Profile (outside / inside)', value: 'profile' },
            { label: 'Pocket (clear the interior)', value: 'pocket' },
            { label: 'Follow path (cut on the line)', value: 'follow' },
            { label: 'Drill (holes / centers)', value: 'drill' },
            { label: 'Holes along a path', value: 'drillpath' },
          ],
        },
        {
          key: 'note',
          type: 'label',
          wide: true,
          label: 'Profile and pocket need closed paths. Follow path and holes along a path work with open or closed paths.',
        },
      ],
      submitLabel: 'Continue',
    }).then((v) => {
      if (v) void this.createOperation(v.type as OperationType);
    });
  }

  private async createOperation(type: OperationType): Promise<void> {
    const selected = this.selectedPaths();
    if (selected.length === 0) {
      showToast('Select one or more paths first', 'warning', 2600);
      return;
    }
    let paths = selected;
    if (type === 'profile' || type === 'pocket' || type === 'drill') {
      paths = selected.filter((p) => isClosedPath(p));
      if (paths.length === 0) {
        showToast('This operation needs at least one closed path', 'warning', 3200);
        return;
      }
      if (paths.length < selected.length) {
        showToast('Open paths were ignored for this operation', 'info', 3000);
      }
    }
    if (type === 'drill' && paths.length === 0) {
      showToast('Select at least one closed path to drill', 'warning', 2600);
      return;
    }

    const fields = this.operationFields(type);
    const values = await openDialog({
      title: `${TYPE_LABEL[type]} operation`,
      description: this.operationDescription(type),
      fields,
      submitLabel: 'Create toolpath',
      wide: true,
      validate: (v) => this.validateOperation(type, v),
    });
    if (!values) return;

    const params = this.paramsFromValues(type, values);
    const name = String(values.name || `${type} ${this.operations.length + 1}`).trim() || `${type} ${this.operations.length + 1}`;
    const op: Operation = {
      id: this.newOperationId(),
      type,
      name,
      params,
      pathIds: paths.map((p) => p.id!).filter(Boolean),
      loops: [],
      drillPoints: [],
      processed: false,
      visible: true,
    };
    this.pushUndo();
    const warnings = this.regenerateOperation(op);
    this.operations.push(op);
    this.selectedOperationId = op.id;
    this.updateSelectionUI();
    this.updateEmptyState();
    if (!op.processed) {
      showToast(warnings[0] || 'No toolpath could be generated. Try different parameters.', 'error', 6000);
    } else if (warnings.length > 0) {
      showToast(
        `${TYPE_LABEL[type]} created with warnings: ${warnings.slice(0, 2).join(' ')}`,
        'warning',
        6000,
      );
    } else {
      showToast(`${TYPE_LABEL[type]} created`, 'success', 3200);
    }
    this.requestRender();
  }

  private operationDescription(type: OperationType): string {
    switch (type) {
      case 'profile':
        return 'Cut around the selected closed paths, offset by the cutter radius.';
      case 'pocket':
        return 'Clear the interior with concentric offsets. Step-over is a percentage of the cutter diameter.';
      case 'follow':
        return 'Run the cutter directly along the selected paths (no offset).';
      case 'drill':
        return 'Peck-drill at the centre of each closed path, or fill the shape with a hole pattern.';
      case 'drillpath':
        return 'Place a fixed number of holes evenly along each selected path and peck-drill them to the target depth.';
    }
  }

  private operationFields(type: OperationType, op?: Operation): DialogField[] {
    const p = op?.params ?? DEFAULT_PARAMS(this.unit);
    const u = this.unitLabel();
    const len = (mm: number) => Number(this.toDisplay(mm).toFixed(4));
    const fields: DialogField[] = [
      { key: 'name', label: 'Name', type: 'text', value: op?.name ?? `${type} ${this.operations.length + 1}` },
      {
        key: 'toolDiameter',
        label: 'Tool diameter',
        type: 'number',
        value: len(p.toolDiameter),
        min: 0.001,
        step: 0.1,
        suffix: u,
      },
      {
        key: 'targetDepth',
        label: 'Target depth',
        type: 'number',
        value: len(p.targetDepth),
        step: 0.1,
        suffix: u,
        help: 'Usually negative (below the stock surface).',
      },
    ];

    if (type === 'profile') {
      fields.push(
        {
          key: 'outside',
          label: 'Offset side',
          type: 'select',
          value: p.outside,
          options: [
            { label: 'Outside', value: true },
            { label: 'Inside', value: false },
          ],
        },
        { key: 'safetyHeight', label: 'Safety height', type: 'number', value: len(p.safetyHeight), step: 0.1, suffix: u },
        { key: 'stockSurface', label: 'Stock surface', type: 'number', value: len(p.stockSurface), step: 0.1, suffix: u },
        { key: 'stepdown', label: 'Step down', type: 'number', value: len(p.stepdown), min: 0.001, step: 0.1, suffix: u },
        { key: 'feedrate', label: 'Feed rate', type: 'number', value: len(p.feedrate), min: 0.001, step: 10, suffix: `${u}/min` },
        { key: 'plungerate', label: 'Plunge rate', type: 'number', value: len(p.plungerate), min: 0.001, step: 10, suffix: `${u}/min` },
        {
          key: 'direction',
          label: 'Direction',
          type: 'select',
          value: p.direction,
          options: [
            { label: 'Counter-clockwise (climb)', value: 1 },
            { label: 'Clockwise (conventional)', value: 2 },
          ],
        },
        { key: 'tabSpacing', label: 'Tab spacing (0 = off)', type: 'number', value: len(p.tabSpacing), min: 0, step: 1, suffix: u },
        { key: 'tabWidth', label: 'Tab width', type: 'number', value: len(p.tabWidth), min: 0, step: 0.1, suffix: u },
        { key: 'tabHeight', label: 'Tab height', type: 'number', value: len(p.tabHeight), min: 0, step: 0.1, suffix: u },
      );
    } else if (type === 'pocket') {
      fields.push(
        { key: 'safetyHeight', label: 'Safety height', type: 'number', value: len(p.safetyHeight), step: 0.1, suffix: u },
        { key: 'stockSurface', label: 'Stock surface', type: 'number', value: len(p.stockSurface), step: 0.1, suffix: u },
        { key: 'stepover', label: 'Step over (%)', type: 'number', value: Number((p.stepover * 100).toFixed(2)), min: 1, max: 100, step: 1, suffix: '%' },
        { key: 'stepdown', label: 'Step down', type: 'number', value: len(p.stepdown), min: 0.001, step: 0.1, suffix: u },
        { key: 'roughingClearance', label: 'Roughing clearance', type: 'number', value: len(p.roughingClearance), min: 0, step: 0.1, suffix: u },
        { key: 'feedrate', label: 'Feed rate', type: 'number', value: len(p.feedrate), min: 0.001, step: 10, suffix: `${u}/min` },
        { key: 'plungerate', label: 'Plunge rate', type: 'number', value: len(p.plungerate), min: 0.001, step: 10, suffix: `${u}/min` },
        {
          key: 'direction',
          label: 'Direction',
          type: 'select',
          value: p.direction,
          options: [
            { label: 'Counter-clockwise (climb)', value: 1 },
            { label: 'Clockwise (conventional)', value: 2 },
          ],
        },
      );
    } else if (type === 'follow') {
      fields.push(
        { key: 'safetyHeight', label: 'Safety height', type: 'number', value: len(p.safetyHeight), step: 0.1, suffix: u },
        { key: 'stockSurface', label: 'Stock surface', type: 'number', value: len(p.stockSurface), step: 0.1, suffix: u },
        { key: 'stepdown', label: 'Step down', type: 'number', value: len(p.stepdown), min: 0.001, step: 0.1, suffix: u },
        { key: 'feedrate', label: 'Feed rate', type: 'number', value: len(p.feedrate), min: 0.001, step: 10, suffix: `${u}/min` },
        { key: 'plungerate', label: 'Plunge rate', type: 'number', value: len(p.plungerate), min: 0.001, step: 10, suffix: `${u}/min` },
      );
    } else if (type === 'drillpath') {
      fields.push(
        {
          key: 'holeCount',
          label: 'Number of holes',
          type: 'number',
          value: Math.max(1, Math.round(p.holeCount)),
          min: 1,
          step: 1,
          help: 'Holes are spaced evenly along each selected path.',
        },
        { key: 'safetyHeight', label: 'Safety height', type: 'number', value: len(p.safetyHeight), step: 0.1, suffix: u },
        { key: 'stockSurface', label: 'Stock surface', type: 'number', value: len(p.stockSurface), step: 0.1, suffix: u },
        { key: 'stepdown', label: 'Peck distance', type: 'number', value: len(p.stepdown), min: 0.001, step: 0.1, suffix: u },
        { key: 'plungerate', label: 'Plunge rate', type: 'number', value: len(p.plungerate), min: 0.001, step: 10, suffix: `${u}/min` },
      );
    } else {
      fields.push(
        {
          key: 'center',
          label: 'Drill location',
          type: 'select',
          value: p.center,
          options: [
            { label: 'Path centre', value: true },
            { label: 'Fill pattern', value: false },
          ],
        },
        { key: 'spacing', label: 'Hole spacing', type: 'number', value: len(p.spacing), min: 0.001, step: 0.5, suffix: u },
        { key: 'safetyHeight', label: 'Safety height', type: 'number', value: len(p.safetyHeight), step: 0.1, suffix: u },
        { key: 'stockSurface', label: 'Stock surface', type: 'number', value: len(p.stockSurface), step: 0.1, suffix: u },
        { key: 'stepdown', label: 'Peck distance', type: 'number', value: len(p.stepdown), min: 0.001, step: 0.1, suffix: u },
        { key: 'plungerate', label: 'Plunge rate', type: 'number', value: len(p.plungerate), min: 0.001, step: 10, suffix: `${u}/min` },
      );
    }
    return fields;
  }

  private validateOperation(type: OperationType, v: DialogValues): string | null {
    const n = (key: string) => (typeof v[key] === 'number' ? (v[key] as number) : Number(v[key]));
    if (!String(v.name ?? '').trim()) return 'Give the operation a name.';
    const tool = n('toolDiameter');
    if (!Number.isFinite(tool) || tool <= 0) return 'Tool diameter must be greater than zero.';
    const target = n('targetDepth');
    const stock = Number.isFinite(n('stockSurface')) ? n('stockSurface') : 0;
    if (!Number.isFinite(target)) return 'Target depth must be a number.';
    if (target >= stock) return 'Target depth must be below the stock surface.';
    const safety = n('safetyHeight');
    if (!Number.isFinite(safety) || safety < target) return 'Safety height must be above the target depth.';
    const stepdown = n('stepdown');
    if (!Number.isFinite(stepdown) || stepdown <= 0) return 'Step down must be greater than zero.';
    const plunge = n('plungerate');
    if (!Number.isFinite(plunge) || plunge <= 0) return 'Plunge rate must be greater than zero.';
    if (type !== 'drill' && type !== 'drillpath') {
      const feed = n('feedrate');
      if (!Number.isFinite(feed) || feed <= 0) return 'Feed rate must be greater than zero.';
    }
    if (type === 'pocket') {
      const so = n('stepover');
      if (!Number.isFinite(so) || so <= 0 || so > 100) return 'Step over must be between 1 and 100%.';
      if (n('roughingClearance') < 0) return 'Roughing clearance cannot be negative.';
    }
    if (type === 'drill' && v.center === false) {
      const spacing = n('spacing');
      if (!Number.isFinite(spacing) || spacing <= 0) return 'Hole spacing must be greater than zero.';
    }
    if (type === 'drillpath') {
      const holes = n('holeCount');
      if (!Number.isFinite(holes) || holes < 1 || Math.round(holes) !== holes) {
        return 'Number of holes must be a whole number of at least 1.';
      }
    }
    if (type === 'profile') {
      const ts = n('tabSpacing');
      const tw = n('tabWidth');
      const th = n('tabHeight');
      const any = ts > 0 || tw > 0 || th > 0;
      if (any && (ts <= 0 || tw <= 0 || th <= 0)) return 'For tabs, set spacing, width and height (or set all to 0).';
      if (any && ts <= tw) return 'Tab spacing must be greater than the tab width.';
    }
    return null;
  }

  private paramsFromValues(type: OperationType, v: DialogValues): OperationParams {
    const p = DEFAULT_PARAMS(this.unit);
    const n = (key: string, fallback: number) => {
      const raw = v[key];
      const x = typeof raw === 'number' ? raw : Number(raw);
      return Number.isFinite(x) ? x : fallback;
    };
    p.toolDiameter = this.fromDisplay(n('toolDiameter', this.toDisplay(p.toolDiameter)));
    p.targetDepth = this.fromDisplay(n('targetDepth', this.toDisplay(p.targetDepth)));
    p.safetyHeight = this.fromDisplay(n('safetyHeight', this.toDisplay(p.safetyHeight)));
    p.stockSurface = this.fromDisplay(n('stockSurface', this.toDisplay(p.stockSurface)));
    p.stepdown = this.fromDisplay(n('stepdown', this.toDisplay(p.stepdown)));
    p.feedrate = this.fromDisplay(n('feedrate', this.toDisplay(p.feedrate)));
    p.plungerate = this.fromDisplay(n('plungerate', this.toDisplay(p.plungerate)));
    if (type === 'profile') {
      p.outside = v.outside !== false;
      p.direction = (Number(v.direction) === 2 ? 2 : 1) as Direction;
      p.tabSpacing = this.fromDisplay(Math.max(0, n('tabSpacing', 0)));
      p.tabWidth = this.fromDisplay(Math.max(0, n('tabWidth', 0)));
      p.tabHeight = this.fromDisplay(Math.max(0, n('tabHeight', 0)));
    } else if (type === 'pocket') {
      p.stepover = Math.max(0.01, Math.min(1, n('stepover', 40) / 100));
      p.roughingClearance = this.fromDisplay(Math.max(0, n('roughingClearance', 0)));
      p.direction = (Number(v.direction) === 2 ? 2 : 1) as Direction;
    } else if (type === 'drill') {
      p.center = v.center !== false;
      p.spacing = this.fromDisplay(Math.max(0.001, n('spacing', 1)));
    } else if (type === 'drillpath') {
      p.holeCount = Math.max(1, Math.round(n('holeCount', 4)));
    }
    return p;
  }

  private editOperation(op: Operation): void {
    void openDialog({
      title: `Edit ${TYPE_LABEL[op.type].toLowerCase()}`,
      description: op.name,
      fields: this.operationFields(op.type, op),
      submitLabel: 'Save and regenerate',
      wide: true,
      validate: (v) => this.validateOperation(op.type, v),
    }).then((values) => {
      if (!values) return;
      this.pushUndo();
      op.name = String(values.name || op.name).trim() || op.name;
      op.params = this.paramsFromValues(op.type, values);
      const warnings = this.regenerateOperation(op);
      this.selectedOperationId = op.id;
      this.updateSelectionUI();
      if (!op.processed) showToast(warnings[0] || 'No toolpath generated', 'error', 5000);
      else showToast('Toolpath updated', warnings.length ? 'warning' : 'success', 2500);
    });
  }

  private deleteOperation(op: Operation): void {
    this.pushUndo();
    this.operations = this.operations.filter((o) => o.id !== op.id);
    if (this.selectedOperationId === op.id) this.selectedOperationId = null;
    this.updateSelectionUI();
    showToast('Operation deleted', 'info', 1800);
  }

  private moveOperation(op: Operation, delta: number): void {
    const i = this.operations.findIndex((o) => o.id === op.id);
    const j = i + delta;
    if (i < 0 || j < 0 || j >= this.operations.length) return;
    this.pushUndo();
    const copy = this.operations.slice();
    const tmp = copy[i];
    copy[i] = copy[j];
    copy[j] = tmp;
    this.operations = copy;
    this.selectedOperationId = op.id;
    this.renderOperations();
    this.requestRender();
    showToast('Operation order updated (G-code follows this list)', 'info', 2200);
  }

  private addTabsDialog(): void {
    const op = this.operations.find((o) => o.id === this.selectedOperationId && o.type === 'profile');
    if (!op) {
      showToast('Select a profile operation first', 'warning', 3000);
      return;
    }
    const u = this.unitLabel();
    void openDialog({
      title: 'Add tabs',
      description: 'Tabs leave small uncut bridges so the part does not come loose. Set spacing, width and height.',
      fields: [
        { key: 'tabSpacing', label: 'Tab spacing', type: 'number', value: Number(this.toDisplay(op.params.tabSpacing).toFixed(3)), min: 0.001, step: 1, suffix: u },
        { key: 'tabWidth', label: 'Tab width', type: 'number', value: Number(this.toDisplay(op.params.tabWidth).toFixed(3)), min: 0.001, step: 0.1, suffix: u },
        { key: 'tabHeight', label: 'Tab height', type: 'number', value: Number(this.toDisplay(op.params.tabHeight).toFixed(3)), min: 0.001, step: 0.1, suffix: u },
      ],
      submitLabel: 'Apply tabs',
      validate: (v) => {
        const ts = Number(v.tabSpacing);
        const tw = Number(v.tabWidth);
        const th = Number(v.tabHeight);
        if (!(ts > 0 && tw > 0 && th > 0)) return 'All tab values must be greater than zero.';
        if (ts <= tw) return 'Tab spacing must be greater than the tab width.';
        return null;
      },
    }).then((v) => {
      if (!v) return;
      this.pushUndo();
      op.params.tabSpacing = this.fromDisplay(Number(v.tabSpacing));
      op.params.tabWidth = this.fromDisplay(Number(v.tabWidth));
      op.params.tabHeight = this.fromDisplay(Number(v.tabHeight));
      this.regenerateOperation(op);
      this.selectedOperationId = op.id;
      this.updateSelectionUI();
      this.requestRender();
      showToast('Tabs applied', 'success', 2000);
    });
  }

  private renderOperations(): void {
    const list = document.getElementById('op-list');
    const empty = document.getElementById('op-empty');
    const count = document.getElementById('op-count');
    const exportBtn = document.getElementById('btn-export') as HTMLButtonElement | null;
    if (!list) return;

    if (count) {
      count.textContent =
        this.operations.length === 0
          ? 'No operations yet'
          : `${this.operations.length} operation${this.operations.length === 1 ? '' : 's'}`;
    }
    if (exportBtn) {
      exportBtn.disabled = !this.operations.some((o) => o.processed);
    }

    list.innerHTML = '';
    if (this.operations.length === 0) {
      const emptyEl = document.createElement('div');
      emptyEl.className = 'op-empty';
      emptyEl.innerHTML =
        '<p>No CAM operations yet.</p><p class="muted">Select one or more paths and choose <strong>CAM → Profile</strong>, <strong>Pocket</strong>, <strong>Drill</strong> or <strong>Holes along path</strong>.</p>';
      list.appendChild(emptyEl);
      return;
    }
    if (empty) empty.remove();

    for (const op of this.operations) {
      const item = document.createElement('div');
      item.className = 'op-item' + (op.id === this.selectedOperationId ? ' selected' : '');
      item.dataset.opId = op.id;

      const swatch = document.createElement('span');
      swatch.className = 'op-swatch';
      swatch.style.background = TYPE_COLOR[op.type];

      const main = document.createElement('div');
      main.className = 'op-main';
      const name = document.createElement('div');
      name.className = 'op-name';
      name.textContent = op.name;
      const meta = document.createElement('div');
      meta.className = 'op-meta';
      const bits: string[] = [];
      bits.push(TYPE_LABEL[op.type]);
      bits.push(`Ø ${this.fmtLen(op.params.toolDiameter, 2)} ${this.unit}`);
      bits.push(`depth ${this.fmtLen(op.params.targetDepth, 2)} ${this.unit}`);
      if ((op.type === 'drill' || op.type === 'drillpath') && op.processed) {
        bits.push(`${op.drillPoints.length} hole${op.drillPoints.length === 1 ? '' : 's'}`);
      } else if (op.processed) {
        bits.push(`${op.loops.length} loop${op.loops.length === 1 ? '' : 's'}`);
      }
      for (const b of bits) {
        const span = document.createElement('span');
        span.textContent = b;
        meta.appendChild(span);
      }
      if (!op.processed) {
        const badge = document.createElement('span');
        badge.className = 'op-badge warn';
        badge.textContent = 'no toolpath';
        meta.appendChild(badge);
      }
      if (!op.visible) {
        const badge = document.createElement('span');
        badge.className = 'op-badge';
        badge.textContent = 'hidden';
        meta.appendChild(badge);
      }
      main.appendChild(name);
      main.appendChild(meta);

      const actions = document.createElement('div');
      actions.className = 'op-actions';
      const vis = document.createElement('input');
      vis.type = 'checkbox';
      vis.className = 'op-visibility';
      vis.checked = op.visible;
      vis.title = 'Show / hide toolpath';
      vis.addEventListener('click', (e) => e.stopPropagation());
      vis.addEventListener('change', () => {
        op.visible = vis.checked;
        this.requestRender();
        this.renderOperations();
      });
      const index = this.operations.indexOf(op);
      const up = document.createElement('button');
      up.type = 'button';
      up.title = 'Move earlier in the machining order';
      up.textContent = '↑';
      up.disabled = index <= 0;
      up.addEventListener('click', (e) => {
        e.stopPropagation();
        this.moveOperation(op, -1);
      });
      const down = document.createElement('button');
      down.type = 'button';
      down.title = 'Move later in the machining order';
      down.textContent = '↓';
      down.disabled = index >= this.operations.length - 1;
      down.addEventListener('click', (e) => {
        e.stopPropagation();
        this.moveOperation(op, 1);
      });
      const edit = document.createElement('button');
      edit.type = 'button';
      edit.title = 'Edit';
      edit.textContent = '✎';
      edit.addEventListener('click', (e) => {
        e.stopPropagation();
        this.editOperation(op);
      });
      const del = document.createElement('button');
      del.type = 'button';
      del.title = 'Delete';
      del.textContent = '✕';
      del.addEventListener('click', (e) => {
        e.stopPropagation();
        void confirmDialog(`Delete "${op.name}"?`, 'Delete operation').then((yes) => {
          if (yes) this.deleteOperation(op);
        });
      });
      actions.appendChild(up);
      actions.appendChild(down);
      actions.appendChild(edit);
      actions.appendChild(del);

      item.appendChild(vis);
      item.appendChild(swatch);
      item.appendChild(main);
      item.appendChild(actions);
      item.addEventListener('click', () => {
        this.selectedOperationId = op.id;
        this.updateSelectionUI();
        this.renderOperations();
      });
      item.addEventListener('dblclick', () => this.editOperation(op));
      list.appendChild(item);
    }
  }

  /* ------------------------------------------------------------------ */
  /* Insert shapes                                                       */
  /* ------------------------------------------------------------------ */

  private viewCenterWorld(): Vec {
    const rect = this.canvas.getBoundingClientRect();
    return screenToWorld(this.view, { x: rect.width / 2, y: rect.height / 2 });
  }

  private insertShapeDialog(): void {
    void openDialog({
      title: 'Insert shape',
      description: 'The shape is placed at the centre of the current view.',
      fields: [
        {
          key: 'shape',
          label: 'Shape',
          type: 'select',
          value: 'circle',
          options: [
            { label: 'Circle', value: 'circle' },
            { label: 'Ellipse', value: 'ellipse' },
            { label: 'Rectangle', value: 'rectangle' },
            { label: 'Rounded rectangle', value: 'roundedrect' },
            { label: 'Polygon', value: 'polygon' },
            { label: 'Star', value: 'star' },
          ],
        },
      ],
      submitLabel: 'Continue',
    }).then((v) => {
      if (v) void this.insertShape(v.shape as string);
    });
  }

  private async insertShape(shape: string): Promise<void> {
    const u = this.unitLabel();
    const mm = (x: number) => this.fromDisplay(x);
    let fields: DialogField[] = [];
    if (shape === 'circle') {
      fields = [{ key: 'diameter', label: 'Diameter', type: 'number', value: this.toDisplay(25.4), min: 0.001, step: 1, suffix: u }];
    } else if (shape === 'ellipse') {
      fields = [
        { key: 'width', label: 'Width', type: 'number', value: this.toDisplay(50.8), min: 0.001, step: 1, suffix: u },
        { key: 'height', label: 'Height', type: 'number', value: this.toDisplay(25.4), min: 0.001, step: 1, suffix: u },
      ];
    } else if (shape === 'rectangle') {
      fields = [
        { key: 'width', label: 'Width', type: 'number', value: this.toDisplay(50.8), min: 0.001, step: 1, suffix: u },
        { key: 'height', label: 'Height', type: 'number', value: this.toDisplay(38.1), min: 0.001, step: 1, suffix: u },
      ];
    } else if (shape === 'roundedrect') {
      fields = [
        { key: 'width', label: 'Width', type: 'number', value: this.toDisplay(50.8), min: 0.001, step: 1, suffix: u },
        { key: 'height', label: 'Height', type: 'number', value: this.toDisplay(38.1), min: 0.001, step: 1, suffix: u },
        { key: 'radius', label: 'Corner radius', type: 'number', value: this.toDisplay(5), min: 0, step: 0.5, suffix: u },
      ];
    } else if (shape === 'polygon') {
      fields = [
        { key: 'sides', label: 'Number of sides', type: 'number', value: 6, min: 3, step: 1 },
        { key: 'radius', label: 'Radius', type: 'number', value: this.toDisplay(25.4), min: 0.001, step: 1, suffix: u },
      ];
    } else if (shape === 'star') {
      fields = [
        { key: 'points', label: 'Number of points', type: 'number', value: 6, min: 3, step: 1 },
        { key: 'radius', label: 'Outer radius', type: 'number', value: this.toDisplay(25.4), min: 0.001, step: 1, suffix: u },
        { key: 'pointiness', label: 'Pointiness (%)', type: 'number', value: 50, min: 1, max: 99, step: 1, suffix: '%' },
      ];
    }

    const values = await openDialog({
      title: `Insert ${shape === 'roundedrect' ? 'rounded rectangle' : shape}`,
      fields,
      submitLabel: 'Insert',
      validate: (v) => {
        for (const f of fields) {
          if (f.type !== 'number') continue;
          const n = Number(v[f.key]);
          if (!Number.isFinite(n)) return `${f.label} must be a number.`;
          if (f.min !== undefined && n < f.min) return `${f.label} is too small.`;
          if (f.max !== undefined && n > f.max) return `${f.label} is too large.`;
        }
        return null;
      },
    });
    if (!values) return;

    const c = this.viewCenterWorld();
    const n = (k: string) => Number(values[k]);
    let path: Path;
    let label = shape;
    if (shape === 'circle') {
      const r = mm(n('diameter')) / 2;
      path = ellipsePath(c.x, c.y, r, r);
      label = 'Circle';
    } else if (shape === 'ellipse') {
      path = ellipsePath(c.x, c.y, mm(n('width')) / 2, mm(n('height')) / 2);
      label = 'Ellipse';
    } else if (shape === 'rectangle') {
      const w = mm(n('width'));
      const h = mm(n('height'));
      path = rectPath(c.x - w / 2, c.y - h / 2, w, h);
      label = 'Rectangle';
    } else if (shape === 'roundedrect') {
      const w = mm(n('width'));
      const h = mm(n('height'));
      path = roundedRectPath(c.x - w / 2, c.y - h / 2, w, h, mm(n('radius')));
      label = 'Rounded rectangle';
    } else if (shape === 'polygon') {
      path = polygonPath(c.x, c.y, mm(n('radius')), n('sides'), Math.PI / 2);
      label = 'Polygon';
    } else {
      path = starPath(c.x, c.y, mm(n('radius')), n('points'), n('pointiness'));
      label = 'Star';
    }
    this.pushUndo();
    path.id = this.newPathId();
    path.name = label;
    this.paths.push(path);
    this.selection.clear();
    this.selection.add(path.id);
    this.selectedOperationId = null;
    this.updateSelectionUI();
    this.updateEmptyState();
    this.requestRender();
  }

  /* ------------------------------------------------------------------ */
  /* Transformations                                                     */
  /* ------------------------------------------------------------------ */

  private selectionCenter(): Vec | null {
    const selected = this.selectedPaths();
    if (selected.length === 0) return null;
    let b: Bounds | null = null;
    for (const p of selected) b = boundsUnion(b, polygonBounds(flattenPath(p, 0.2)));
    if (!b) return null;
    return { x: (b.minX + b.maxX) / 2, y: (b.minY + b.maxY) / 2 };
  }

  private applyTransformToSelection(m: Matrix, label: string): void {
    const selected = this.selectedPaths();
    if (selected.length === 0) {
      showToast('Select one or more paths first', 'info', 2200);
      return;
    }
    this.pushUndo();
    const ids = new Set(selected.map((p) => p.id!));
    this.paths = this.paths.map((p) => (p.id && ids.has(p.id) ? transformPath(p, m) : p));
    this.regenerateAll(true);
    this.updateSelectionUI();
    this.requestRender();
    showToast(label, 'success', 1800);
  }

  private scaleDialog(): void {
    const center = this.selectionCenter();
    if (!center) {
      showToast('Select one or more paths first', 'info', 2200);
      return;
    }
    void openDialog({
      title: 'Scale selection',
      fields: [
        { key: 'sx', label: 'Scale X (%)', type: 'number', value: 100, step: 1, suffix: '%' },
        { key: 'sy', label: 'Scale Y (%)', type: 'number', value: 100, step: 1, suffix: '%' },
      ],
      submitLabel: 'Scale',
      validate: (v) =>
        !Number.isFinite(Number(v.sx)) || !Number.isFinite(Number(v.sy)) || Number(v.sx) === 0 || Number(v.sy) === 0
          ? 'Scale values must be non-zero numbers.'
          : null,
    }).then((v) => {
      if (!v) return;
      const sx = Number(v.sx) / 100;
      const sy = Number(v.sy) / 100;
      const m = matrixMultiply(
        matrixMultiply(matrixTranslate(center.x, center.y), matrixScale(sx, sy)),
        matrixTranslate(-center.x, -center.y),
      );
      this.applyTransformToSelection(m, 'Selection scaled');
    });
  }

  private rotateDialog(): void {
    const center = this.selectionCenter();
    if (!center) {
      showToast('Select one or more paths first', 'info', 2200);
      return;
    }
    void openDialog({
      title: 'Rotate selection',
      fields: [{ key: 'angle', label: 'Angle', type: 'number', value: 0, step: 1, suffix: '°' }],
      submitLabel: 'Rotate',
      validate: (v) => (Number.isFinite(Number(v.angle)) ? null : 'Enter an angle in degrees.'),
    }).then((v) => {
      if (!v) return;
      const angle = Number(v.angle);
      if (angle === 0) return;
      const m = matrixMultiply(
        matrixMultiply(matrixTranslate(center.x, center.y), matrixRotate((angle * Math.PI) / 180)),
        matrixTranslate(-center.x, -center.y),
      );
      this.applyTransformToSelection(m, 'Selection rotated');
    });
  }

  private skewDialog(): void {
    const center = this.selectionCenter();
    if (!center) {
      showToast('Select one or more paths first', 'info', 2200);
      return;
    }
    void openDialog({
      title: 'Skew selection',
      fields: [
        { key: 'skx', label: 'Skew X (%)', type: 'number', value: 0, step: 1, suffix: '%' },
        { key: 'sky', label: 'Skew Y (%)', type: 'number', value: 0, step: 1, suffix: '%' },
      ],
      submitLabel: 'Skew',
    }).then((v) => {
      if (!v) return;
      const skx = Number(v.skx) || 0;
      const sky = Number(v.sky) || 0;
      if (skx === 0 && sky === 0) return;
      const skew: Matrix = {
        a: 1,
        b: Math.tan(-sky / 100),
        c: Math.tan(-skx / 100),
        d: 1,
        e: 0,
        f: 0,
      };
      const m = matrixMultiply(
        matrixMultiply(matrixTranslate(center.x, center.y), skew),
        matrixTranslate(-center.x, -center.y),
      );
      this.applyTransformToSelection(m, 'Selection skewed');
    });
  }

  private repairOpenPathsDialog(): void {
    const selection = this.selectedPaths();
    const scope = selection.length > 0 ? selection : this.paths;
    const open = scope.filter((p) => p.segments.length > 0 && !isClosedPath(p));
    if (open.length === 0) {
      showToast(
        selection.length > 0
          ? 'The selected paths are already closed.'
          : 'There are no open paths to repair.',
        'info',
        2400,
      );
      return;
    }

    const u = this.unitLabel();
    void openDialog({
      title: 'Repair open paths',
      description:
        `${open.length} open path${open.length === 1 ? '' : 's'} ` +
        `${selection.length > 0 ? 'in the selection' : 'in the drawing'}. ` +
        'Close adds a line across each path’s own gap; join merges free ends of different paths that meet.',
      fields: [
        {
          key: 'tolerance',
          label: 'Max gap',
          type: 'number',
          value: Number(this.toDisplay(0.2).toFixed(4)),
          min: 0,
          step: 0.05,
          suffix: u,
        },
        { key: 'close', label: 'Close each path’s own gap', type: 'checkbox', value: true },
        { key: 'join', label: 'Join ends between paths', type: 'checkbox', value: true },
      ],
      submitLabel: 'Repair',
      validate: (v) => {
        const t = Number(v.tolerance);
        if (!Number.isFinite(t) || t < 0) return 'Max gap must be zero or more.';
        if (!v.close && !v.join) return 'Choose at least one repair action.';
        return null;
      },
    }).then((v) => {
      if (!v) return;
      this.repairOpenPaths(open, this.fromDisplay(Number(v.tolerance)), !!v.close, !!v.join);
    });
  }

  private repairOpenPaths(
    targets: Path[],
    tolerance: number,
    closeGaps: boolean,
    joinEnds: boolean,
  ): void {
    this.pushUndo();
    let closedCount = 0;
    let joinCount = 0;

    if (closeGaps) {
      for (const path of targets) {
        if (closePathGap(path, tolerance)) closedCount++;
      }
    }

    if (joinEnds) {
      const result = joinOpenPaths(targets, tolerance);
      joinCount = result.joins;
      if (result.absorbed.size > 0) {
        const absorbed = new Set(result.absorbed.keys());
        for (const [absorbedPath, owner] of result.absorbed) {
          if (absorbedPath.id && this.selection.has(absorbedPath.id)) {
            this.selection.delete(absorbedPath.id);
            if (owner.id) this.selection.add(owner.id);
          }
          if (!absorbedPath.id || !owner.id || absorbedPath.id === owner.id) continue;
          if (this.nestBoundaryId === absorbedPath.id) this.nestBoundaryId = owner.id;
          // Operations that referenced the absorbed path now use its owner.
          for (const op of this.operations) {
            if (!op.pathIds.includes(absorbedPath.id)) continue;
            op.pathIds = [
              ...new Set(op.pathIds.map((id) => (id === absorbedPath.id ? owner.id! : id))),
            ];
          }
        }
        this.paths = this.paths.filter((p) => !absorbed.has(p));
        const survivingIds = new Set(this.paths.map((p) => p.id));
        this.selection = new Set([...this.selection].filter((id) => survivingIds.has(id)));
      }
    }

    this.regenerateAll(true);
    this.updateSelectionUI();
    this.requestRender();

    if (closedCount === 0 && joinCount === 0) {
      showToast('No open ends were within the maximum gap.', 'warning', 4000);
      return;
    }
    const parts: string[] = [];
    if (closedCount > 0) parts.push(`${closedCount} gap${closedCount === 1 ? '' : 's'} closed`);
    if (joinCount > 0) parts.push(`${joinCount} join${joinCount === 1 ? '' : 's'} made`);
    showToast(`Repaired open paths: ${parts.join(', ')}.`, 'success', 3200);
  }

  /* ------------------------------------------------------------------ */
  /* File operations                                                     */
  /* ------------------------------------------------------------------ */

  private async readFile(file: File): Promise<void> {
    try {
      const text = await file.text();
      await this.importText(text, file.name);
    } catch (e) {
      showError('Could not read the file', (e as Error).message);
    }
  }

  async importText(text: string, filename = 'drawing.svg', replace = false): Promise<void> {
    try {
      const project = parseProject(text, { pxPerInch: this.pxPerInch });
      if (project) {
        this.loadProject(project, filename);
        return;
      }
      const imported = parseSvg(text, { pxPerInch: this.pxPerInch });
      if (imported.paths.length === 0) {
        showError('Nothing to import', imported.warnings.join('\n') || 'No supported geometry was found.');
        return;
      }
      this.pushUndo();
      if (replace) {
        this.paths = [];
        this.operations = [];
        this.selection.clear();
        this.selectedOperationId = null;
        this.nextPathId = 1;
        this.nextOperationId = 1;
      }
      for (const p of imported.paths) {
        p.id = this.newPathId();
        this.paths.push(p);
      }
      this.selection.clear();
      this.selectedOperationId = null;
      this.updateSelectionUI();
      this.updateEmptyState();
      requestAnimationFrame(() => this.fit());
      showToast(
        `Imported ${imported.paths.length} path${imported.paths.length === 1 ? '' : 's'} from ${filename}`,
        'success',
        3500,
      );
      if (imported.warnings.length > 0) {
        showToast(imported.warnings.slice(0, 3).join(' '), 'warning', 7000);
      }
    } catch (e) {
      showError('Could not import SVG', (e as Error).message);
    }
  }

  private loadProject(project: ProjectData, filename: string): void {
    this.pushUndo();
    this.paths = project.paths;
    this.ensurePathIds(this.paths);
    this.nextOperationId = 1;
    this.operations = [];
    this.operations = project.operations.map((def) => ({
      id: def.id || this.newOperationId(),
      type: def.type,
      name: def.name,
      params: def.params,
      pathIds: def.pathIds,
      loops: [],
      drillPoints: [],
      processed: false,
      visible: true,
    }));
    this.selection.clear();
    this.selectedOperationId = this.operations[0]?.id ?? null;
    this.regenerateAll(true);
    this.updateSelectionUI();
    this.updateEmptyState();
    this.renderOperations();
    requestAnimationFrame(() => this.fit());
    showToast(
      `Opened ${filename}: ${this.paths.length} paths, ${this.operations.length} operations`,
      'success',
      4000,
    );
    if (project.warnings.length > 0) {
      showToast(project.warnings.slice(0, 3).join(' '), 'warning', 7000);
    }
  }

  private saveProject(): void {
    if (this.paths.length === 0) {
      showToast('There is nothing to save yet', 'info', 2200);
      return;
    }
    const defs = this.operations.map((op) => ({
      id: op.id,
      type: op.type,
      name: op.name,
      params: op.params,
      pathIds: op.pathIds,
    }));
    const svg = serializeProject(this.paths, defs, this.unit);
    downloadText('makercam-project.svg', svg, 'image/svg+xml');
    showToast('Project saved (SVG + CAM metadata)', 'success', 2600);
  }

  private exportGcodeDialog(): void {
    const processed = this.operations.filter((o) => o.processed);
    if (processed.length === 0) {
      showToast('Create and generate at least one toolpath first', 'warning', 3000);
      return;
    }
    const fields: DialogField[] = [
      {
        key: 'unit',
        label: 'Output units',
        type: 'select',
        value: this.unit,
        options: [
          { label: 'Millimetres (G21)', value: 'mm' },
          { label: 'Inches (G20)', value: 'in' },
        ],
      },
      { key: 'sep', type: 'label', wide: true, label: 'Toolpaths to export:' },
    ];
    for (const op of processed) {
      fields.push({
        key: `op_${op.id}`,
        label: `${op.name} — ${TYPE_LABEL[op.type]}, Ø ${this.fmtLen(op.params.toolDiameter)} ${this.unit}`,
        type: 'checkbox',
        value: true,
        wide: true,
      });
    }
    void openDialog({
      title: 'Export G-code',
      description: 'Only generated toolpaths are listed. The file uses one tool change per distinct cutter.',
      fields,
      submitLabel: 'Download .nc',
      wide: true,
      validate: (v) => {
        const any = processed.some((op) => v[`op_${op.id}`] === true);
        return any ? null : 'Select at least one toolpath.';
      },
    }).then((v) => {
      if (!v) return;
      const selected = processed.filter((op) => v[`op_${op.id}`] === true);
      const outputUnit = (v.unit === 'in' ? 'in' : 'mm') as Unit;
      const gcode = generateGcode(selected, outputUnit, this.tolerance);
      if (!gcode) {
        showToast('The selected toolpaths produced no G-code', 'error', 3200);
        return;
      }
      downloadText('part.nc', gcode, 'text/plain');
      const est = selected.reduce((sum, op) => sum + estimateTime(op), 0);
      showToast(
        `G-code exported: ${selected.length} toolpath${selected.length === 1 ? '' : 's'}, ~${Math.max(1, Math.round(est))} min`,
        'success',
        4000,
      );
    });
  }

  /* ------------------------------------------------------------------ */
  /* Nesting                                                             */
  /* ------------------------------------------------------------------ */

  private setNestBoundary(): void {
    const selected = this.selectedPaths().filter((p) => isClosedPath(p));
    if (selected.length !== 1) {
      showToast('Select exactly one closed path to use as the material boundary', 'warning', 3500);
      return;
    }
    this.nestBoundaryId = selected[0].id!;
    this.updateHint(`Material boundary: ${selected[0].name || 'path'}`);
    showToast('Material boundary set', 'success', 2200);
  }

  private runNestDialog(): void {
    const boundary = this.paths.find((p) => p.id === this.nestBoundaryId);
    if (!boundary || !isClosedPath(boundary)) {
      showToast('Set a closed material boundary first (Nesting → Set material boundary)', 'warning', 4200);
      return;
    }
    const ops = this.operations.filter((o) => o.processed && o.pathIds.length > 0 && !o.pathIds.includes(this.nestBoundaryId!));
    if (ops.length < 2) {
      showToast('At least two generated toolpaths are required for nesting', 'warning', 3500);
      return;
    }
    const u = this.unitLabel();
    void openDialog({
      title: 'Nest toolpaths',
      description: 'Pack the generated toolpaths inside the boundary, trying several rotations.',
      fields: [
        { key: 'gap', label: 'Space between objects', type: 'number', value: Number(this.toDisplay(3).toFixed(3)), min: 0, step: 0.5, suffix: u },
        {
          key: 'rotations',
          label: 'Rotations to try',
          type: 'select',
          value: 8,
          options: [
            { label: '4 (0°, 90°, 180°, 270°)', value: 4 },
            { label: '8 (45° steps)', value: 8 },
            { label: '12 (30° steps)', value: 12 },
            { label: '16 (22.5° steps)', value: 16 },
          ],
        },
      ],
      submitLabel: 'Nest',
    }).then((v) => {
      if (!v) return;
      this.runNest(boundary, ops, this.fromDisplay(Number(v.gap) || 0), Number(v.rotations) || 8);
    });
  }

  private runNest(boundary: Path, ops: Operation[], gap: number, rotationCount: number): void {
    const boundaryPoints = closedPolygon(boundary, 0.1);
    if (boundaryPoints.length < 3) {
      showToast('The boundary path is invalid', 'error', 3000);
      return;
    }

    const items: NestItem[] = [];
    const outlines: Vec[][] = [];
    for (const op of ops) {
      const paths = this.pathsForOperation(op);
      const points: Vec[] = [];
      for (const p of paths) {
        for (const q of flattenPath(p, 0.3)) points.push(q);
        for (const seg of p.segments) {
          if (seg.kind === 'cubic') {
            points.push(seg.c1, seg.c2);
          } else if (seg.kind === 'quad') {
            points.push(seg.c);
          }
        }
      }
      if (points.length < 3) {
        outlines.push([]);
        items.push({ outline: [], sourceLoops: op.loops });
        continue;
      }
      let hull = convexHull(points);
      const buffer = op.params.toolDiameter / 2 + gap / 2;
      if (buffer > 0 && hull.length >= 3) {
        const buffered = offsetRegion(
          [{ points: hull, depth: 0, closed: true, pocketDepth: 0, tabs: [] }],
          buffer,
        );
        if (buffered.length > 0) {
          // Use the largest outer loop.
          const outer = buffered
            .filter((l) => l.depth % 2 === 0)
            .sort((a, b) => Math.abs(polygonArea(b.points)) - Math.abs(polygonArea(a.points)))[0];
          if (outer) hull = outer.points;
        }
      }
      outlines.push(hull);
      items.push({ outline: hull, sourceLoops: op.loops });
    }

    const b = polygonBounds(boundaryPoints);
    const step = Math.max(1, Math.min(10, Math.max(b.maxX - b.minX, b.maxY - b.minY) / 120));
    const rotations = Array.from({ length: rotationCount }, (_, i) => (i * 2 * Math.PI) / rotationCount);
    let placements;
    try {
      placements = nestItems(boundaryPoints, items, { gap, rotations, step });
    } catch (e) {
      showError('Nesting failed', (e as Error).message);
      return;
    }
    if (placements.length === 0) {
      showToast('None of the objects fit inside the boundary', 'warning', 4200);
      return;
    }

    this.pushUndo();
    const applied = new Set<string>();
    for (const placement of placements) {
      const op = ops[placement.index];
      if (!op) continue;
      const m = matrixMultiply(matrixTranslate(placement.position.x, placement.position.y), matrixRotate(placement.rotation));
      const pathIds = this.pathsForOperation(op).map((p) => p.id!).filter(Boolean);
      for (const id of pathIds) {
        if (applied.has(id)) continue;
        const idx = this.paths.findIndex((p) => p.id === id);
        if (idx >= 0) {
          this.paths[idx] = transformPath(this.paths[idx], m);
          applied.add(id);
        }
      }
    }
    this.regenerateAll(true);
    this.updateSelectionUI();
    this.requestRender();
    showToast(
      `Nested ${placements.length} of ${ops.length} operations (${applied.size} paths moved)`,
      placements.length < ops.length ? 'warning' : 'success',
      5000,
    );
  }

  /* ------------------------------------------------------------------ */
  /* Example project                                                     */
  /* ------------------------------------------------------------------ */

  private loadExample(): void {
    try {
      const imported = parseSvg(EXAMPLE_SVG, { pxPerInch: this.pxPerInch });
      if (imported.paths.length === 0) {
        showError('Could not load the example', 'The bundled example SVG produced no geometry.');
        return;
      }
      this.pushUndo();
      this.paths = [];
      this.operations = [];
      this.selection.clear();
      this.selectedOperationId = null;
      this.nextPathId = 1;
      this.nextOperationId = 1;
      this.nestBoundaryId = null;
      for (const p of imported.paths) {
        p.id = this.newPathId();
        this.paths.push(p);
      }
      const bySource = new Map<string, Path>();
      for (const p of this.paths) {
        if (p.sourceId) bySource.set(p.sourceId, p);
      }
      const base = DEFAULT_PARAMS('mm');
      const add = (type: OperationType, name: string, params: OperationParams, paths: Path[]) => {
        const op: Operation = {
          id: this.newOperationId(),
          type,
          name,
          params,
          pathIds: paths.map((p) => p.id!).filter(Boolean),
          loops: [],
          drillPoints: [],
          processed: false,
          visible: true,
        };
        this.regenerateOperation(op);
        this.operations.push(op);
        return op;
      };

      // Machining order: drill the holes, clear the pocket, then cut the
      // outside profile last so the part stays attached until the end.
      const holes = ['hole1', 'hole2']
        .map((id) => bySource.get(id))
        .filter((p): p is Path => !!p);
      if (holes.length > 0) {
        add(
          'drill',
          'Bolt holes',
          {
            ...base,
            toolDiameter: 5,
            targetDepth: -8,
            safetyHeight: 12,
            stockSurface: 0,
            stepdown: 2,
            feedrate: 300,
            plungerate: 250,
            center: true,
          },
          holes,
        );
      }
      const pocket = bySource.get('pocket');
      if (pocket) {
        add(
          'pocket',
          'Inner pocket',
          {
            ...base,
            toolDiameter: 6.35,
            targetDepth: -4,
            safetyHeight: 12,
            stockSurface: 0,
            stepdown: 2,
            stepover: 0.4,
            roughingClearance: 0,
            feedrate: 800,
            plungerate: 300,
            direction: 1,
          },
          [pocket],
        );
      }
      const outline = bySource.get('outline');
      if (outline) {
        add(
          'profile',
          'Plate outline',
          {
            ...base,
            toolDiameter: 6.35,
            targetDepth: -6,
            safetyHeight: 12,
            stockSurface: 0,
            stepdown: 2,
            feedrate: 900,
            plungerate: 300,
            outside: true,
            direction: 1,
            tabSpacing: 60,
            tabWidth: 6,
            tabHeight: 3,
          },
          [outline],
        );
      }

      this.selectedOperationId = this.operations[this.operations.length - 1]?.id ?? null;
      this.regenerateAll(true);
      this.updateSelectionUI();
      this.updateEmptyState();
      requestAnimationFrame(() => this.fit());
      showToast('Example loaded: drill, pocket and profile', 'success', 4000);
      if (imported.warnings.length > 0) {
        showToast(imported.warnings.slice(0, 2).join(' '), 'warning', 5000);
      }
    } catch (e) {
      showError('Could not load the example', (e as Error).message);
    }
  }

  /* ------------------------------------------------------------------ */
  /* Preferences and help                                                */
  /* ------------------------------------------------------------------ */

  private preferencesDialog(): void {
    void openDialog({
      title: 'Preferences',
      fields: [
        {
          key: 'pxPerInch',
          label: 'SVG import resolution',
          type: 'number',
          value: this.pxPerInch,
          min: 1,
          step: 1,
          suffix: 'px/in',
          help: 'Illustrator/Flash commonly use 72; Inkscape and CSS use 90/96.',
        },
        {
          key: 'tolerance',
          label: 'CAM curve tolerance',
          type: 'number',
          value: this.tolerance,
          min: 0.001,
          step: 0.001,
          suffix: 'mm',
          help: 'Smaller values produce smoother curves and more G-code.',
        },
        { key: 'grid', label: 'Show grid', type: 'checkbox', value: this.grid },
        { key: 'snap', label: 'Snap to grid', type: 'checkbox', value: this.snap },
        { key: 'showToolpaths', label: 'Show toolpaths', type: 'checkbox', value: this.showToolpaths },
        { key: 'showToolDiameter', label: 'Show cutter diameter', type: 'checkbox', value: this.showToolDiameter },
      ],
      submitLabel: 'Save',
      validate: (v) => {
        if (!(Number(v.pxPerInch) > 0)) return 'Import resolution must be greater than zero.';
        if (!(Number(v.tolerance) > 0)) return 'Tolerance must be greater than zero.';
        return null;
      },
    }).then((v) => {
      if (!v) return;
      this.pxPerInch = Number(v.pxPerInch);
      this.tolerance = Number(v.tolerance);
      this.grid = !!v.grid;
      this.snap = !!v.snap;
      this.showToolpaths = !!v.showToolpaths;
      this.showToolDiameter = !!v.showToolDiameter;
      this.savePrefs();
      const gridBtn = document.getElementById('btn-grid');
      gridBtn?.classList.toggle('active', this.grid);
      const snapBtn = document.getElementById('btn-snap');
      snapBtn?.classList.toggle('active', this.snap);
      const tpBtn = document.getElementById('btn-show-toolpaths');
      tpBtn?.classList.toggle('active', this.showToolpaths);
      const tdBtn = document.getElementById('btn-show-diameter');
      tdBtn?.classList.toggle('active', this.showToolDiameter);
      this.regenerateAll(true);
      this.requestRender();
      showToast('Preferences saved', 'success', 2000);
    });
  }

  private quickGuide(): void {
    void openDialog({
      title: 'Quick guide',
      description: 'The same workflow as the original MakerCam, in a modern browser.',
      fields: [
        { key: 'a', type: 'label', wide: true, label: '1. Import an SVG with File → Import SVG, or insert a shape from the Insert menu.' },
        { key: 'b', type: 'label', wide: true, label: '2. Use Select (V) to click paths, Shift-click to add, and drag to move. Scroll to zoom; hold Space to pan.' },
        { key: 'c', type: 'label', wide: true, label: '3. Choose CAM → Profile, Pocket, Follow path, Drill or Holes along path. Closed paths are required for profile/pocket/drill.' },
        { key: 'd', type: 'label', wide: true, label: '4. Inspect the green/orange toolpaths. Select an operation in the sidebar to edit or delete it.' },
        { key: 'e', type: 'label', wide: true, label: '5. Export G-code from the Toolpaths menu or the sidebar button. Save the project as SVG to keep operations.' },
        { key: 'f', type: 'label', wide: true, label: 'Tip: CAM → Add tabs leaves bridges on profile cuts. Use Show cutter diameter to preview the material removal.' },
      ],
      submitLabel: 'Got it',
    });
  }

  private about(): void {
    void openDialog({
      title: `About ${APP_NAME}`,
      description:
        'A modern TypeScript/Canvas port of PartKam / MakerCam, the browser-based 2.5D CAM tool written in ActionScript 3 by Jack Clark circa 2010. The original is LGPL-3.0; this port is derived from its source and is distributed under the same license.',
      fields: [
        { key: 'a', type: 'label', wide: true, label: 'Features: SVG import, interactive editing, profile/pocket/follow/drill/holes-along-path toolpaths, tabs, nesting, and G-code export.' },
        { key: 'b', type: 'label', wide: true, label: 'Geometry is processed in millimetres. G-code can be written in millimetres (G21) or inches (G20).' },
        { key: 'c', type: 'label', wide: true, label: 'Always verify toolpaths and G-code before running a machine.' },
      ],
      submitLabel: 'Close',
    });
  }

  /* ------------------------------------------------------------------ */
  /* Command routing                                                     */
  /* ------------------------------------------------------------------ */

  private async handleCommand(cmd: string): Promise<void> {
    switch (cmd) {
      case 'file-import':
        this.fileInput.click();
        break;
      case 'file-open-project':
        this.fileInput.click();
        break;
      case 'file-save':
        this.saveProject();
        break;
      case 'file-export':
        this.exportGcodeDialog();
        break;
      case 'file-new':
        if (await confirmDialog('Start a new project? Unsaved changes will be lost.', 'New project')) {
          this.pushUndo();
          this.paths = [];
          this.operations = [];
          this.selection.clear();
          this.selectedOperationId = null;
          this.nextPathId = 1;
          this.nextOperationId = 1;
          this.nestBoundaryId = null;
          this.updateSelectionUI();
          this.updateEmptyState();
          this.fit();
        }
        break;
      case 'edit-undo':
        this.undo();
        break;
      case 'edit-redo':
        this.redo();
        break;
      case 'edit-selectall':
        this.selectAll();
        break;
      case 'edit-copy':
        this.copySelection();
        break;
      case 'edit-paste':
        this.pasteSelection();
        break;
      case 'edit-delete':
        this.deleteSelection();
        break;
      case 'edit-scale':
        this.scaleDialog();
        break;
      case 'edit-rotate':
        this.rotateDialog();
        break;
      case 'edit-skew':
        this.skewDialog();
        break;
      case 'edit-repair-open':
        this.repairOpenPathsDialog();
        break;
      case 'edit-preferences':
        this.preferencesDialog();
        break;
      case 'insert-circle':
        await this.insertShape('circle');
        break;
      case 'insert-ellipse':
        await this.insertShape('ellipse');
        break;
      case 'insert-rectangle':
        await this.insertShape('rectangle');
        break;
      case 'insert-roundedrect':
        await this.insertShape('roundedrect');
        break;
      case 'insert-polygon':
        await this.insertShape('polygon');
        break;
      case 'insert-star':
        await this.insertShape('star');
        break;
      case 'cam-profile':
        await this.createOperation('profile');
        break;
      case 'cam-pocket':
        await this.createOperation('pocket');
        break;
      case 'cam-follow':
        await this.createOperation('follow');
        break;
      case 'cam-drill':
        await this.createOperation('drill');
        break;
      case 'cam-drillpath':
        await this.createOperation('drillpath');
        break;
      case 'cam-tabs':
        this.addTabsDialog();
        break;
      case 'cam-regenerate':
        this.pushUndo();
        this.regenerateAll();
        showToast('Toolpaths regenerated', 'success', 2200);
        break;
      case 'cam-delete': {
        const op = this.operations.find((o) => o.id === this.selectedOperationId);
        if (op) void confirmDialog(`Delete "${op.name}"?`, 'Delete operation').then((yes) => yes && this.deleteOperation(op));
        else showToast('Select an operation in the sidebar first', 'info', 2200);
        break;
      }
      case 'toolpaths-export':
        this.exportGcodeDialog();
        break;
      case 'toolpaths-toggle':
        this.toggleToolpaths();
        break;
      case 'toolpaths-diameter':
        this.toggleToolDiameter();
        break;
      case 'toolpaths-refit':
        this.fit();
        break;
      case 'nest-boundary':
        this.setNestBoundary();
        break;
      case 'nest-run':
        this.runNestDialog();
        break;
      case 'help-example':
        this.loadExample();
        break;
      case 'help-guide':
        this.quickGuide();
        break;
      case 'help-about':
        this.about();
        break;
    }
  }
}

// Start the application once the DOM is ready.
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new App());
} else {
  new App();
}
