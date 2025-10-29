// modlike-react/tests/dump-dom.spec.ts
import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

test('dump key elements on /login', async ({ page }) => {
  await page.goto('http://localhost:5173/login', { waitUntil: 'domcontentloaded' });

  const headings = await page.$$eval('h1,h2,h3', els =>
    els.map(el => ({ tag: el.tagName, text: (el.textContent || '').trim() }))
  );

  const buttons = await page.$$eval('button', els =>
    els.map(el => (el.textContent || '').trim())
  );

  const outDir = path.join(process.cwd(), 'artifacts');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);
  fs.writeFileSync(path.join(outDir, 'login.headings.json'), JSON.stringify(headings, null, 2));
  fs.writeFileSync(path.join(outDir, 'login.buttons.json'), JSON.stringify(buttons, null, 2));

  await page.screenshot({ path: 'artifacts/login.png', fullPage: true });
  await expect(true).toBeTruthy();
});

