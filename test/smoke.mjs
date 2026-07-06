// Dev-only smoke test (not shipped). Serves the project over HTTP, loads the
// page in headless Chromium, and checks the config-driven UI actually builds and
// behaves: both clusters render with the right buttons, and long-pressing a
// submenu host (Injection) pops its submenu. Saves a screenshot to test/smoke.png.
//
//   node test/smoke.mjs
//
// Must be served over HTTP (not file://) because index.html fetch()es
// mvr_annotate.json — a file:// origin trips the CORS fail-loud banner.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join, normalize } from 'node:path';
import { chromium } from 'playwright';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const TYPES = { '.html': 'text/html', '.json': 'application/json', '.svg': 'image/svg+xml' };

// Minimal static file server rooted at the project dir.
const server = createServer(async (req, res) => {
  try {
    const rel = normalize(decodeURIComponent(req.url.split('?')[0])).replace(/^(\.\.[/\\])+/, '');
    const path = join(root, rel === '/' ? 'index.html' : rel);
    const body = await readFile(path);
    const ext = path.slice(path.lastIndexOf('.'));
    res.writeHead(200, { 'content-type': TYPES[ext] || 'application/octet-stream' });
    res.end(body);
  } catch {
    res.writeHead(404); res.end('not found');
  }
});

const EXPECT = {
  segments: ['Illeum', 'R.Colon', 'Tv.Colon', 'L.Colon', 'S.Colon', 'Rectum'],
  actions: ['Withdrawal', 'Injection', 'Hemostasis', 'Biopsy', 'Polyp'],
  injectionSubmenu: ['Lift', 'Hemostasis', 'Botox', 'Steroid', 'Tattoo', 'Contrast'],
};

const fail = (msg) => { console.error('✗ ' + msg); process.exitCode = 1; };
const ok = (msg) => console.log('✓ ' + msg);
const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);

await new Promise((r) => server.listen(0, r));
const port = server.address().port;
const base = `http://localhost:${port}/`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1024, height: 768 } });

// Any console error or uncaught exception fails the test (e.g. the fail-loud banner).
const errors = [];
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
page.on('pageerror', (e) => errors.push(String(e)));

try {
  await page.goto(base, { waitUntil: 'networkidle' });

  // Read the built clusters' button labels straight from the DOM.
  const clusters = await page.$$eval('.cluster', (els) =>
    els.map((el) => [...el.querySelectorAll('button .label')].map((s) => s.textContent)));

  if (clusters.length !== 2) fail(`expected 2 clusters at load, got ${clusters.length}`);
  else ok('two clusters built from config');

  if (eq(clusters[0], EXPECT.segments)) ok('cluster 1 = segments buttons');
  else fail(`cluster 1 buttons mismatch: ${JSON.stringify(clusters[0])}`);

  if (eq(clusters[1], EXPECT.actions)) ok('cluster 2 = actions buttons');
  else fail(`cluster 2 buttons mismatch: ${JSON.stringify(clusters[1])}`);

  // Long-press the Injection host: hover, press, hold past LONG_PRESS_MS (500ms)
  // without moving so fireLongPress opens the submenu mid-hold, then release.
  const injection = page.locator('.cluster button', { hasText: 'Injection' }).first();
  const box = await injection.boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.waitForTimeout(750);
  await page.mouse.up();

  await page.waitForFunction(() => document.querySelectorAll('.cluster').length === 3, { timeout: 2000 })
    .then(() => ok('long-press Injection opened a submenu (3rd cluster)'))
    .catch(() => fail('submenu did not open on long-press'));

  const all = await page.$$eval('.cluster', (els) =>
    els.map((el) => [...el.querySelectorAll('button .label')].map((s) => s.textContent)));
  const submenu = all.find((c) => eq(c, EXPECT.injectionSubmenu) ||
    JSON.stringify(c) === JSON.stringify(EXPECT.injectionSubmenu));
  if (submenu) ok('submenu = Injection modifiers');
  else fail(`Injection submenu buttons not found; clusters: ${JSON.stringify(all)}`);

  const shot = join(root, 'test', 'smoke.png');
  await page.screenshot({ path: shot });
  ok(`screenshot saved: ${shot}`);

  if (errors.length) fail(`console/page errors: ${JSON.stringify(errors)}`);
  else ok('no console or page errors');
} finally {
  await browser.close();
  server.close();
}

console.log(process.exitCode ? '\nSMOKE TEST FAILED' : '\nSMOKE TEST PASSED');
