import { chromium } from 'playwright';
import path from 'node:path';
import {existsSync} from 'node:fs';
const url = process.argv[2];
const out = process.argv[3] || 'qa/shot.png';
const w = Number(process.env.W || 1280), h = Number(process.env.H || 800);
const browser = await chromium.launch({ headless: true,
  executablePath: [process.env.CHROME, chromium.executablePath(), 'C:/Program Files/Google/Chrome/Application/chrome.exe'].find(p => p && existsSync(p)),
  args: ['--use-angle=default', '--enable-webgl', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: Number(process.env.DPR || 1.5) });
page.on('console', m => console.log('[console]', m.type(), m.text().slice(0, 400)));
page.on('pageerror', e => console.log('[pageerror]', e.message));
await page.goto(url, { waitUntil: 'networkidle', timeout: 90000 });
try {
  await page.waitForFunction(() => window.__ready || window.__error, null, { timeout: 60000 });
} catch (e) { console.log('wait timeout'); }
const err = await page.evaluate(() => window.__error || null);
const info = await page.evaluate(() => window.__info || null);
if (info) console.log('INFO', JSON.stringify(info));
if (err) console.log('ERROR', err);
await page.waitForTimeout(800);
await page.screenshot({ path: out });
console.log('SHOT', path.resolve(out));
await browser.close();
