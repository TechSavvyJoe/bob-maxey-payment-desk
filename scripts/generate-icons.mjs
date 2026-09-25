import { readFile, writeFile, copyFile } from 'node:fs/promises';
import { URL } from 'node:url';
import { chromium } from '@playwright/test';

// The original SVG is the source of truth. Install assets are opaque, full-bleed
// squares; iOS/Android apply their own corner masks. The mark fits a 40% safe circle.
const publicDir = new URL('../public/', import.meta.url);
const artwork = await readFile(new URL('payment-desk-icon.svg', publicDir), 'utf8');
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ deviceScaleFactor: 1 });
  for (const [size, name, legacy] of [
    [180, 'payment-desk-apple-touch-icon.png', 'apple-touch-icon.png'],
    [192, 'payment-desk-192.png', 'icon-192.png'],
    [512, 'payment-desk-512.png', 'icon-512.png'],
  ]) {
    await page.setViewportSize({ width: size, height: size });
    await page.setContent(`<style>html,body{margin:0}svg{display:block;width:100vw;height:100vh}</style>${artwork}`);
    const output = new URL(name, publicDir);
    await writeFile(output, await page.screenshot({ type: 'png' }));
    // Preserve automatic Apple discovery and older manifest URLs.
    await copyFile(output, new URL(legacy, publicDir));
  }
  // Browser favicons have their own rounded tile, independent of OS install masks.
  const favicon = artwork.replace('width="512" height="512"', 'width="64" height="64"')
    .replace('<path fill="url(#desk-blue)" d="M0 0H64V64H0Z"/>', '<rect width="64" height="64" rx="14" fill="url(#desk-blue)"/>');
  await writeFile(new URL('favicon.svg', publicDir), favicon);
} finally {
  await browser.close();
}
