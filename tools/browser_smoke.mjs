import { chromium } from 'playwright-core';

const executablePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const browser = await chromium.launch({ executablePath, headless: true });
const page = await browser.newPage({ viewport: { width: 1400, height: 900 }, acceptDownloads: true });

const errors = [];
page.on('console', (msg) => {
  if (msg.type() === 'error') errors.push('console: ' + msg.text());
});
page.on('pageerror', (err) => errors.push('pageerror: ' + err.message));

await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
await page.waitForSelector('#canvas');
await page.waitForTimeout(600);
await page.screenshot({ path: 'tools/screens/01-empty.png' });

// Insert a circle through the menu.
await page.click('[data-menu="insert"]');
await page.click('[data-command="insert-circle"]');
await page.waitForSelector('.modal');
await page.fill('input[name="diameter"]', '50');
await page.click('.modal-actions button[type="submit"]');
await page.waitForTimeout(400);
await page.screenshot({ path: 'tools/screens/02-circle.png' });

// The circle should be selected; create an outside profile.
await page.click('[data-menu="cam"]');
await page.click('[data-command="cam-profile"]');
await page.waitForSelector('.modal');
await page.fill('input[name="name"]', 'outside profile');
await page.fill('input[name="toolDiameter"]', '6');
await page.fill('input[name="targetDepth"]', '-6');
await page.fill('input[name="stepdown"]', '3');
await page.click('.modal-actions button[type="submit"]');
await page.waitForTimeout(600);
await page.screenshot({ path: 'tools/screens/03-profile.png' });

const opCount = await page.locator('.op-item').count();
const status = await page.locator('#status-selection').textContent();

// Switch to inches and back, to exercise the unit path.
await page.selectOption('#unit-select', 'in');
await page.waitForTimeout(300);
const unitText = await page.locator('#status-coords').textContent();
await page.selectOption('#unit-select', 'mm');

// Export G-code and capture the download.
await page.click('#btn-export');
await page.waitForSelector('.modal');
const downloadPromise = page.waitForEvent('download', { timeout: 10000 });
await page.click('.modal-actions button[type="submit"]');
const download = await downloadPromise;
const gcodePath = 'tools/screens/part.nc';
await download.saveAs(gcodePath);

// Insert a rectangle and a drill operation.
await page.click('[data-menu="insert"]');
await page.click('[data-command="insert-rectangle"]');
await page.waitForSelector('.modal');
await page.fill('input[name="width"]', '40');
await page.fill('input[name="height"]', '20');
await page.click('.modal-actions button[type="submit"]');
await page.waitForTimeout(300);
await page.click('[data-menu="cam"]');
await page.click('[data-command="cam-drill"]');
await page.waitForSelector('.modal');
await page.fill('input[name="name"]', 'holes');
await page.click('.modal-actions button[type="submit"]');
await page.waitForTimeout(500);
await page.screenshot({ path: 'tools/screens/04-drill.png' });

// Toggle cutter preview.
await page.click('#btn-show-diameter');
await page.waitForTimeout(300);
await page.screenshot({ path: 'tools/screens/05-cutter.png' });

console.log(JSON.stringify({ opCount, status, unitText, errors }, null, 2));
await browser.close();
