import { chromium } from 'playwright-core';

const browser = await chromium.launch({ executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', headless: true });
const page = await browser.newPage({ viewport: { width: 1400, height: 900 }, acceptDownloads: true });
const errors = [];
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', (e) => errors.push(e.message));

const url = 'file:///C:/Users/v_t_m/source/repos/MakerCam/dist/index.html';
await page.goto(url, { waitUntil: 'load' });
await page.waitForFunction(() => window.makercam !== undefined);
await page.waitForTimeout(400);

// Insert a circle and create a pocket entirely offline.
await page.click('[data-menu="insert"]');
await page.click('[data-command="insert-circle"]');
await page.waitForSelector('.modal');
await page.fill('input[name="diameter"]', '40');
await page.click('.modal-actions button[type="submit"]');
await page.waitForTimeout(300);
await page.click('[data-menu="cam"]');
await page.click('[data-command="cam-pocket"]');
await page.waitForSelector('.modal');
await page.click('.modal-actions button[type="submit"]');
await page.waitForSelector('.modal', { state: 'detached' });
await page.waitForTimeout(500);

const state = await page.evaluate(() => ({
  paths: window.makercam.paths.length,
  ops: window.makercam.operations.map((o) => ({ type: o.type, processed: o.processed, loops: o.loops.length })),
}));
console.log('file:// state', state);

// Save project and export G-code from file://.
await page.click('[data-menu="file"]');
const saveDl = page.waitForEvent('download', { timeout: 10000 });
await page.click('[data-command="file-save"]');
const saved = await saveDl;
await saved.saveAs('tools/screens/file-saved.svg');

await page.click('#btn-export');
await page.waitForSelector('.modal');
const gDl = page.waitForEvent('download', { timeout: 10000 });
await page.click('.modal-actions button[type="submit"]');
const g = await gDl;
await g.saveAs('tools/screens/file-part.nc');
await page.screenshot({ path: 'tools/screens/16-file-protocol.png' });
console.log('ERRORS', errors);
await browser.close();
