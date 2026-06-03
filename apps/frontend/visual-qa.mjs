import { chromium, devices } from '@playwright/test';

const base = 'http://localhost:3002';
const pages = [
  { name: 'dashboard', url: '/' },
  { name: 'wizard', url: '/books/new' },
  { name: 'preview', url: '/books/book-1/preview' },
  { name: 'detail', url: '/books/book-1' },
  { name: 'profiles', url: '/profiles' },
  { name: 'settings', url: '/settings' },
];

const browser = await chromium.launch({ headless: true });

async function shotDesktop() {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  for (const p of pages) {
    await page.goto(base + p.url, { waitUntil: 'networkidle' });
    await page.screenshot({ path: `qa-screens/${p.name}-desktop.png`, fullPage: true });
    const title = await page.locator('h1').first().textContent().catch(() => 'NO_H1');
    console.log(`desktop ${p.name}: ${title ?? 'NO_H1'}`);
  }
  await context.close();
}

async function shotMobile() {
  const context = await browser.newContext({ ...devices['iPhone 13'] });
  const page = await context.newPage();
  for (const p of pages) {
    await page.goto(base + p.url, { waitUntil: 'networkidle' });
    await page.screenshot({ path: `qa-screens/${p.name}-mobile.png`, fullPage: true });
    const title = await page.locator('h1').first().textContent().catch(() => 'NO_H1');
    console.log(`mobile ${p.name}: ${title ?? 'NO_H1'}`);
  }
  await context.close();
}

await shotDesktop();
await shotMobile();
await browser.close();
