import { chromium } from 'playwright-core';
import { writeFileSync } from 'node:fs';
import { executablePath } from './browser_env.mjs';

const browser = await chromium.launch({ executablePath, headless: true });
const page = await browser.newPage({ viewport: { width: 1400, height: 900 }, acceptDownloads: true });
const errors = [];
page.on('console', (m) => {
  if (m.type() === 'error') errors.push('console: ' + m.text());
});
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));

const sample = `<?xml version="1.0"?>
<svg xmlns="http://www.w3.org/2000/svg" width="120mm" height="80mm" viewBox="0 0 120 80">
  <rect x="5" y="5" width="50" height="30"/>
  <circle cx="90" cy="20" r="12"/>
  <path d="M10 55 L40 55 L25 72 Z"/>
  <path d="M65 50 C70 40 85 40 90 50" fill="none"/>
</svg>`;
const samplePath = 'tools/screens/sample.svg';
writeFileSync(samplePath, sample);

const state = () =>
  page.evaluate(() => {
    const app = window.makercam;
    return {
      paths: app.paths.map((p) => ({ id: p.id, name: p.name, closed: p.closed })),
      ops: app.operations.map((o) => ({
        id: o.id,
        type: o.type,
        name: o.name,
        processed: o.processed,
        loops: o.loops.length,
        openLoops: o.loops.filter((l) => !l.closed).length,
        drills: o.drillPoints.length,
        tabs: o.loops.reduce((n, l) => n + l.tabs.length, 0),
        pathIds: o.pathIds,
      })),
      selection: [...app.selection],
    };
  });

async function submitModal() {
  await page.waitForSelector('.modal');
  await page.click('.modal-actions button[type="submit"]');
  await page.waitForSelector('.modal', { state: 'detached' });
  await page.waitForTimeout(250);
}

await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
await page.waitForTimeout(400);

// 1. Import an SVG.
await page.setInputFiles('#file-input', samplePath);
await page.waitForFunction(() => window.makercam && window.makercam.paths.length === 4, null, { timeout: 10000 });
await page.waitForTimeout(500);
await page.screenshot({ path: 'tools/screens/10-import.png' });
let s = await state();
console.log('imported', s);

// 2. Select all and create a pocket.
await page.keyboard.press('Control+A');
s = await state();
console.log('selection after ctrl+a', s.selection.length);
await page.click('[data-menu="cam"]');
await page.click('[data-command="cam-pocket"]');
await submitModal();
s = await state();
console.log('after pocket', s.ops);
await page.screenshot({ path: 'tools/screens/11-pocket.png' });

// 3. Select only the open cubic path and create a follow operation.
const openId = s.paths.find((p) => !p.closed).id;
await page.evaluate((id) => {
  window.makercam.selection = new Set([id]);
  window.makercam.updateSelectionUI();
  window.makercam.requestRender();
}, openId);
await page.click('[data-menu="cam"]');
await page.click('[data-command="cam-follow"]');
await submitModal();
s = await state();
console.log('after follow', s.ops);

// 4. Select the rectangle and make a profile with tabs.
const rectId = s.paths[0].id;
await page.evaluate((id) => {
  window.makercam.selection = new Set([id]);
  window.makercam.updateSelectionUI();
  window.makercam.requestRender();
}, rectId);
await page.click('[data-menu="cam"]');
await page.click('[data-command="cam-profile"]');
await page.waitForSelector('.modal');
await page.fill('input[name="name"]', 'tabbed profile');
await page.fill('input[name="toolDiameter"]', '6');
await page.fill('input[name="targetDepth"]', '-6');
await page.fill('input[name="stepdown"]', '3');
await page.fill('input[name="tabSpacing"]', '15');
await page.fill('input[name="tabWidth"]', '4');
await page.fill('input[name="tabHeight"]', '2');
await submitModal();
s = await state();
console.log('after tabbed profile', s.ops);
await page.screenshot({ path: 'tools/screens/12-tabs.png' });
if (!s.ops.some((o) => o.type === 'profile' && o.tabs > 0)) throw new Error('Tabs were not generated');

// 5. Export all G-code.
await page.click('#btn-export');
await page.waitForSelector('.modal');
const dlPromise = page.waitForEvent('download', { timeout: 15000 });
await page.click('.modal-actions button[type="submit"]');
const dl = await dlPromise;
await dl.saveAs('tools/screens/all.nc');
console.log('gcode downloaded to tools/screens/all.nc');

// 6. Save the project.
await page.click('[data-menu="file"]');
const savePromise = page.waitForEvent('download', { timeout: 15000 });
await page.click('[data-command="file-save"]');
const saveDl = await savePromise;
await saveDl.saveAs('tools/screens/saved-project.svg');
console.log('project saved');

// 7. New project, then reopen the saved project.
await page.click('[data-menu="file"]');
await page.click('[data-command="file-new"]');
await submitModal();
s = await state();
console.log('after new', s.paths.length, s.ops.length);
if (s.paths.length !== 0) throw new Error('New project did not clear paths');

await page.setInputFiles('#file-input', 'tools/screens/saved-project.svg');
await page.waitForFunction(() => window.makercam.paths.length === 4, null, { timeout: 10000 });
await page.waitForTimeout(500);
s = await state();
console.log('after reopen', s.ops);
if (s.ops.length !== 3) throw new Error('Operations were not restored');
if (!s.ops.every((o) => o.processed)) throw new Error('Restored operations were not regenerated');
await page.screenshot({ path: 'tools/screens/13-reopened.png' });

// 8. Undo restores the cleared project; redo clears it again.
await page.keyboard.press('Control+Z');
await page.waitForTimeout(300);
const afterUndo = await state();
console.log('after undo paths', afterUndo.paths.length);

// 9. Pen tool: draw a triangle and finish with Enter.
await page.keyboard.press('Escape');
await page.keyboard.press('p');
const box = await page.locator('#canvas').boundingBox();
const pts = [
  [box.x + 300, box.y + 600],
  [box.x + 400, box.y + 600],
  [box.x + 350, box.y + 520],
];
for (const [x, y] of pts) await page.mouse.click(x, y);
await page.keyboard.press('Enter');
await page.waitForTimeout(300);
const afterPen = await state();
console.log('after pen paths', afterPen.paths.length);

console.log('ERRORS', errors);
await browser.close();
