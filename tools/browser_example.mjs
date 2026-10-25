import { chromium } from 'playwright-core';

const browser = await chromium.launch({ executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', headless: true });
const page = await browser.newPage({ viewport: { width: 1400, height: 900 }, acceptDownloads: true });
const errors = [];
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', (e) => errors.push(e.message));

await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
await page.waitForTimeout(300);
await page.click('#btn-empty-example');
await page.waitForFunction(() => window.makercam && window.makercam.operations.length === 3);
await page.waitForTimeout(700);
const state = await page.evaluate(() => {
  const a = window.makercam;
  return {
    paths: a.paths.map((p) => ({ id: p.id, source: p.sourceId, closed: p.closed })),
    ops: a.operations.map((o) => ({
      type: o.type,
      name: o.name,
      processed: o.processed,
      loops: o.loops.length,
      holes: o.drillPoints.length,
      tabs: o.loops.reduce((n, l) => n + l.tabs.length, 0),
      pathIds: o.pathIds,
    })),
    selected: a.selectedOperationId,
  };
});
console.log(JSON.stringify(state, null, 2));
await page.screenshot({ path: 'tools/screens/30-example.png' });

// Export the example's G-code.
await page.click('#btn-export');
await page.waitForSelector('.modal');
const dlPromise = page.waitForEvent('download', { timeout: 10000 });
await page.click('.modal-actions button[type="submit"]');
const dl = await dlPromise;
await dl.saveAs('tools/screens/example.nc');
console.log('example G-code saved');

// Mobile labels: the panel button should say Panel, the visibility toggle Paths.
const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } });
await mobile.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
await mobile.waitForTimeout(300);
const labels = await mobile.evaluate(() => ({
  panel: document.getElementById('btn-sidebar')?.textContent?.trim(),
  paths: document.getElementById('btn-show-toolpaths')?.textContent?.trim(),
  panelVisible: !!document.getElementById('btn-sidebar') && getComputedStyle(document.getElementById('btn-sidebar')).display !== 'none',
}));
console.log('mobile labels', labels);
await mobile.close();

console.log('ERRORS', errors);
await browser.close();
