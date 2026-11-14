import { chromium } from 'playwright-core';
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
  <circle cx="90" cy="20" r="10"/>
  <path d="M10 55 L30 55 L20 70 Z"/>
</svg>`;
const samplePath = 'tools/screens/nest-sample.svg';
import { writeFileSync } from 'node:fs';
writeFileSync(samplePath, sample);

const state = () =>
  page.evaluate(() => {
    const app = window.makercam;
    return {
      paths: app.paths.map((p) => ({ id: p.id, closed: p.closed })),
      ops: app.operations.map((o) => ({
        id: o.id,
        type: o.type,
        processed: o.processed,
        loops: o.loops.length,
        first: o.loops[0]?.points[0],
        pathIds: o.pathIds,
      })),
      boundary: app.nestBoundaryId,
    };
  });

async function submitModal() {
  await page.waitForSelector('.modal');
  await page.click('.modal-actions button[type="submit"]');
  await page.waitForSelector('.modal', { state: 'detached', timeout: 30000 });
  await page.waitForTimeout(300);
}

await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
await page.setInputFiles('#file-input', samplePath);
await page.waitForFunction(() => window.makercam && window.makercam.paths.length === 3);
await page.waitForTimeout(400);
let s = await state();

// Profile on the circle (p2).
await page.evaluate(() => {
  window.makercam.selection = new Set(['p2']);
  window.makercam.updateSelectionUI();
});
await page.click('[data-menu="cam"]');
await page.click('[data-command="cam-profile"]');
await submitModal();

// Drill on the triangle (p3).
await page.evaluate(() => {
  window.makercam.selection = new Set(['p3']);
  window.makercam.updateSelectionUI();
});
await page.click('[data-menu="cam"]');
await page.click('[data-command="cam-drill"]');
await submitModal();

// Boundary = rectangle (p1).
await page.evaluate(() => {
  window.makercam.selection = new Set(['p1']);
  window.makercam.updateSelectionUI();
});
await page.click('[data-menu="nesting"]');
await page.click('[data-command="nest-boundary"]');
await page.waitForTimeout(200);
s = await state();
console.log('before nest', JSON.stringify(s, null, 2));

// Run nesting.
await page.click('[data-menu="nesting"]');
await page.click('[data-command="nest-run"]');
await page.waitForSelector('.modal');
await page.fill('input[name="gap"]', '2');
await page.selectOption('select[name="rotations"]', '8');
const t0 = Date.now();
await page.click('.modal-actions button[type="submit"]');
await page.waitForSelector('.modal', { state: 'detached', timeout: 60000 });
await page.waitForTimeout(600);
console.log('nest took ms', Date.now() - t0);
s = await state();
console.log('after nest', JSON.stringify(s, null, 2));
await page.screenshot({ path: 'tools/screens/14-nest.png' });

// Check the moved paths now sit inside the rectangle's model bounds (x 5..55, y 45..75).
const inside = await page.evaluate(() => {
  const app = window.makercam;
  const boundary = app.paths.find((p) => p.id === 'p1');
  return app.operations.map((o) => {
    const pts = o.pathIds.flatMap((id) => {
      const p = app.paths.find((x) => x.id === id);
      return p ? p.segments.map((s) => [s.p1.x, s.p1.y]) : [];
    });
    return { name: o.name, minX: Math.min(...pts.map((p) => p[0])), maxX: Math.max(...pts.map((p) => p[0])), minY: Math.min(...pts.map((p) => p[1])), maxY: Math.max(...pts.map((p) => p[1])) };
  });
});
console.log('path bounds after nest', inside);
console.log('ERRORS', errors);
await browser.close();
