import { chromium } from 'playwright-core';

const executablePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const browser = await chromium.launch({ executablePath, headless: true });
const errors = [];

async function makePage(opts = {}) {
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 }, ...opts });
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push(e.message));
  return page;
}

// Desktop light
let page = await makePage();
await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
await page.waitForTimeout(400);
const sidebarBtnVisible = await page.locator('#btn-sidebar').isVisible();
console.log('desktop mobile-toggle visible (should be false):', sidebarBtnVisible);
await page.click('[data-menu="insert"]');
await page.click('[data-command="insert-circle"]');
await page.waitForSelector('.modal');
await page.fill('input[name="diameter"]', '40');
await page.click('.modal-actions button[type="submit"]');
await page.waitForTimeout(300);
await page.click('[data-menu="cam"]');
await page.click('[data-command="cam-profile"]');
await page.waitForSelector('.modal');
await page.click('.modal-actions button[type="submit"]');
await page.waitForSelector('.modal', { state: 'detached' });
await page.waitForTimeout(500);
await page.screenshot({ path: 'tools/screens/20-desktop.png' });
await page.close();

// Desktop dark
page = await makePage({ colorScheme: 'dark' });
await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
await page.waitForTimeout(400);
await page.click('[data-menu="insert"]');
await page.click('[data-command="insert-star"]');
await page.waitForSelector('.modal');
await page.fill('input[name="radius"]', '30');
await page.click('.modal-actions button[type="submit"]');
await page.waitForTimeout(300);
await page.click('[data-menu="cam"]');
await page.click('[data-command="cam-pocket"]');
await page.waitForSelector('.modal');
await page.click('.modal-actions button[type="submit"]');
await page.waitForSelector('.modal', { state: 'detached' });
await page.waitForTimeout(500);
await page.screenshot({ path: 'tools/screens/21-dark.png' });
await page.close();

// Mobile
page = await makePage({ viewport: { width: 390, height: 844 } });
await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
await page.waitForTimeout(400);
const mobileBtnVisible = await page.locator('#btn-sidebar').isVisible();
const sidebarBox = await page.locator('.sidebar').boundingBox();
console.log('mobile toggle visible (should be true):', mobileBtnVisible, 'sidebar x:', sidebarBox?.x);
await page.click('#btn-sidebar');
await page.waitForTimeout(300);
const sidebarBox2 = await page.locator('.sidebar').boundingBox();
console.log('sidebar x after toggle:', sidebarBox2?.x);
await page.screenshot({ path: 'tools/screens/22-mobile.png' });
await page.close();

// Root index.html from disk (uses src/styles.css + dist/app.js)
page = await makePage();
await page.goto('file:///C:/Users/v_t_m/source/repos/MakerCam/index.html', { waitUntil: 'load' });
await page.waitForFunction(() => window.makercam !== undefined);
const rootOk = await page.evaluate(() => !!window.makercam && document.styleSheets.length > 0);
console.log('root index.html works:', rootOk);
await page.close();

console.log('ERRORS', errors);
await browser.close();
