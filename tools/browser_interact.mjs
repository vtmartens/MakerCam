import { chromium } from 'playwright-core';
import { writeFileSync } from 'node:fs';

const executablePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const browser = await chromium.launch({ executablePath, headless: true });
const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
const errors = [];
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', (e) => errors.push(e.message));

const sample = `<?xml version="1.0"?>
<svg xmlns="http://www.w3.org/2000/svg" width="120mm" height="80mm" viewBox="0 0 120 80">
  <rect x="5" y="5" width="50" height="30"/>
  <circle cx="90" cy="20" r="12"/>
  <path d="M10 55 L40 55 L25 72 Z"/>
</svg>`;
writeFileSync('tools/screens/interact.svg', sample);

await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
await page.setInputFiles('#file-input', 'tools/screens/interact.svg');
await page.waitForFunction(() => window.makercam && window.makercam.paths.length === 3);
await page.waitForTimeout(500);

const info = await page.evaluate(() => {
  const app = window.makercam;
  const p = app.paths[0];
  const s = p.segments[0];
  return {
    pathId: p.id,
    start: { x: s.p1.x, y: s.p1.y },
    view: app.view,
    canvas: { w: app.canvas ? 0 : 0 },
  };
});
console.log('view and rect start', info);

// Convert the rectangle's top-left world point to screen coordinates.
const rect = await page.locator('#canvas').boundingBox();
const screen = await page.evaluate(() => {
  const app = window.makercam;
  const p = app.paths[0];
  // Midpoint of the rectangle's bottom edge in model space.
  const s = p.segments[0];
  const x = (s.p1.x + s.p2.x) / 2;
  const y = s.p1.y;
  return { x: app.view.panX + x * app.view.zoom, y: app.view.panY - y * app.view.zoom };
});
console.log('screen click point', screen);

// Drag the rectangle by 30 CSS px to the right.
await page.mouse.move(rect.x + screen.x, rect.y + screen.y);
await page.mouse.down();
await page.mouse.move(rect.x + screen.x + 30, rect.y + screen.y + 0, { steps: 8 });
await page.mouse.up();
await page.waitForTimeout(300);
const afterDrag = await page.evaluate(() => {
  const app = window.makercam;
  const p = app.paths[0];
  const s = p.segments[0];
  return { start: { x: s.p1.x, y: s.p1.y }, zoom: app.view.zoom };
});
console.log('after drag', afterDrag);
if (Math.abs(afterDrag.start.x - info.start.x) < 1) throw new Error('Path did not move');

// Undo should restore the position.
await page.keyboard.press('Control+Z');
await page.waitForTimeout(300);
const afterUndo = await page.evaluate(() => {
  const p = window.makercam.paths[0];
  return { x: p.segments[0].p1.x, y: p.segments[0].p1.y };
});
console.log('after undo', afterUndo);
if (Math.abs(afterUndo.x - info.start.x) > 1e-6) throw new Error('Undo did not restore position');

// Marquee select the circle.
await page.evaluate(() => { window.makercam.selection.clear(); window.makercam.updateSelectionUI(); window.makercam.requestRender(); });
const circleScreen = await page.evaluate(() => {
  const app = window.makercam;
  const p = app.paths[1];
  const c = p.segments[0].p1;
  return { x: app.view.panX + c.x * app.view.zoom, y: app.view.panY - c.y * app.view.zoom };
});
await page.mouse.move(rect.x + circleScreen.x - 120, rect.y + circleScreen.y - 120);
await page.mouse.down();
await page.mouse.move(rect.x + circleScreen.x + 120, rect.y + circleScreen.y + 120, { steps: 10 });
await page.mouse.up();
await page.waitForTimeout(300);
const sel = await page.evaluate(() => [...window.makercam.selection]);
console.log('marquee selection', sel);
if (sel.length < 1) throw new Error('Marquee selection failed');

// Wheel zoom around the centre.
const beforeZoom = await page.evaluate(() => window.makercam.view.zoom);
await page.mouse.move(rect.x + rect.width / 2, rect.y + rect.height / 2);
await page.mouse.wheel(0, -300);
await page.waitForTimeout(200);
const afterZoom = await page.evaluate(() => window.makercam.view.zoom);
console.log('zoom', beforeZoom, '->', afterZoom);
if (!(afterZoom > beforeZoom)) throw new Error('Wheel zoom failed');

// Create a profile, then click its toolpath to select the operation.
await page.keyboard.press('Control+A');
await page.click('[data-menu="cam"]');
await page.click('[data-command="cam-profile"]');
await page.waitForSelector('.modal');
await page.click('.modal-actions button[type="submit"]');
await page.waitForSelector('.modal', { state: 'detached' });
await page.waitForTimeout(400);
await page.evaluate(() => { window.makercam.selection.clear(); window.makercam.selectedOperationId = null; window.makercam.updateSelectionUI(); });
const opScreen = await page.evaluate(() => {
  const app = window.makercam;
  const op = app.operations[0];
  const p = op.loops[0].points[0];
  return { x: app.view.panX + p.x * app.view.zoom, y: app.view.panY - p.y * app.view.zoom };
});
await page.mouse.click(rect.x + opScreen.x, rect.y + opScreen.y);
await page.waitForTimeout(300);
const selectedOp = await page.evaluate(() => window.makercam.selectedOperationId);
console.log('selected operation by toolpath click', selectedOp);
if (!selectedOp) throw new Error('Clicking a toolpath did not select its operation');

await page.screenshot({ path: 'tools/screens/15-interact.png' });
console.log('ERRORS', errors);
await browser.close();
