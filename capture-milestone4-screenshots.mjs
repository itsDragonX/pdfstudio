import { spawn } from 'child_process';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.join(__dirname, 'dist');
const outDir = 'C:\\Users\\ASUS\\.gemini\\antigravity\\brain\\2b797227-fae5-498b-b692-38c294b015a4';

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.mjs': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.webmanifest': 'application/manifest+json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.wasm': 'application/wasm',
  '.bcmap': 'application/octet-stream',
  '.pfb': 'application/octet-stream',
  '.ttf': 'font/ttf'
};

const server = http.createServer((req, res) => {
  let reqPath = req.url.split('?')[0];
  if (reqPath === '/' || reqPath === '') reqPath = '/index.html';
  const filePath = path.join(distDir, reqPath);
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(fs.readFileSync(path.join(distDir, 'index.html')));
    return;
  }
  const ext = path.extname(filePath).toLowerCase();
  const ct = MIME_TYPES[ext] || 'application/octet-stream';
  res.writeHead(200, { 'Content-Type': ct });
  res.end(fs.readFileSync(filePath));
});

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

server.listen(4195, '127.0.0.1', async () => {
  console.log('Static server started on http://127.0.0.1:4195');

  const edgeProc = spawn('C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', [
    '--headless=new',
    '--remote-debugging-port=9227',
    '--user-data-dir=c:\\VS Code\\Codes\\pdfstudio\\.tmp-edge-m4',
    '--window-size=1664,923',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-fre',
    '--disable-search-engine-choice-screen',
    'http://127.0.0.1:4195'
  ]);

  let tabs = null;
  for (let attempt = 0; attempt < 25; attempt++) {
    await sleep(600);
    try {
      const res = await fetch('http://127.0.0.1:9227/json');
      tabs = await res.json();
      if (tabs && tabs.length > 0) break;
    } catch {
      // Retry
    }
  }

  if (!tabs) {
    throw new Error('Failed to connect to Edge remote debugging port 9227');
  }

  try {
    const pageTab = tabs.find((t) => t.url && t.url.includes('4195')) || tabs[0];
    const ws = new WebSocket(pageTab.webSocketDebuggerUrl);

    let id = 1;
    const send = (method, params = {}) =>
      new Promise((resolve) => {
        const reqId = id++;
        const handler = (e) => {
          const data = JSON.parse(e.data);
          if (data.id === reqId) {
            ws.removeEventListener('message', handler);
            resolve(data);
          }
        };
        ws.addEventListener('message', handler);
        ws.send(JSON.stringify({ id: reqId, method, params }));
      });

    await new Promise((resolve) => ws.addEventListener('open', resolve));

    await send('Page.enable');
    await send('Runtime.enable');
    await send('Emulation.setDeviceMetricsOverride', {
      width: 1664,
      height: 923,
      deviceScaleFactor: 1,
      mobile: false
    });

    const takeScreenshot = async (name) => {
      const res = await send('Page.captureScreenshot', { format: 'png' });
      const buf = Buffer.from(res.result.data, 'base64');
      const outPath = path.join(outDir, `${name}.png`);
      fs.writeFileSync(outPath, buf);
      console.log(`Saved screenshot: ${name}.png (${buf.length} bytes)`);
    };

    const evaluate = async (expr) => {
      const code = expr.trim().startsWith('(()') || expr.trim().startsWith('function')
        ? expr
        : `(() => {\n${expr}\n})()`;
      const res = await send('Runtime.evaluate', { expression: code, awaitPromise: true, returnByValue: true });
      if (res.exceptionDetails) {
        console.error('CDP Eval Exception:', res.exceptionDetails.exception?.description || res.exceptionDetails.text);
      }
      return res.result?.value;
    };

    await sleep(2000);

    // 1. Open Sample Document
    console.log('Step 1: Opening sample document...');
    await evaluate(`
      const sampleBtn = document.querySelector('.upload-secondary-cta');
      if (sampleBtn) sampleBtn.click();
    `);
    await sleep(2500);

    // 2. Click Stamp Category in Rail
    console.log('Step 2: Switching to Stamp category...');
    await evaluate(`
      const stampBtn = document.querySelector('.category-rail-btn.category-stamp');
      if (stampBtn) stampBtn.click();
    `);
    await sleep(1000);

    // Screenshot 1: Stamp category tool list
    console.log('Capturing Screenshot 1: Stamp category tool list...');
    await takeScreenshot('m4-01-stamp-category-list');

    // 3. Open Tool 19: Watermark (Text Mode)
    console.log('Step 3: Selecting Watermark tool...');
    await evaluate(`
      const rows = Array.from(document.querySelectorAll('.tool-subpanel-row'));
      const row = rows.find(r => r.innerText.includes('Watermark'));
      if (row) row.click();
    `);
    await sleep(1000);

    // Screenshot 2: Watermark workspace with text preview
    console.log('Capturing Screenshot 2: Watermark workspace with text preview...');
    await takeScreenshot('m4-02-watermark-text-workspace');

    // Screenshot 7: Stamp preview directly on a PDF page
    console.log('Capturing Screenshot 7: Stamp preview on a PDF page...');
    await takeScreenshot('m4-07-stamp-preview-canvas');

    // 4. Switch to Image Watermark Mode
    console.log('Step 4: Switching Watermark to Image mode...');
    await evaluate(`
      const btns = Array.from(document.querySelectorAll('.segmented-control-btn'));
      const imgBtn = btns.find(b => b.innerText.includes('Image Watermark'));
      if (imgBtn) imgBtn.click();
    `);
    await sleep(800);

    // Screenshot 3: Watermark workspace with image mode
    console.log('Capturing Screenshot 3: Watermark workspace with image mode...');
    await takeScreenshot('m4-03-watermark-image-workspace');

    // 5. Open Tool 20: Page Numbers
    console.log('Step 5: Opening Page Numbers workspace...');
    await evaluate(`
      const rows = Array.from(document.querySelectorAll('.tool-subpanel-row'));
      const row = rows.find(r => r.innerText.includes('Page numbers'));
      if (row) row.click();
    `);
    await sleep(1000);

    // Screenshot 4: Page Numbers workspace
    console.log('Capturing Screenshot 4: Page Numbers workspace...');
    await takeScreenshot('m4-04-page-numbers-workspace');

    // 6. Open Tool 21: Header & Footer
    console.log('Step 6: Opening Header & Footer workspace...');
    await evaluate(`
      const rows = Array.from(document.querySelectorAll('.tool-subpanel-row'));
      const row = rows.find(r => r.innerText.includes('Header and footer'));
      if (row) row.click();
    `);
    await sleep(1000);

    // Screenshot 5: Header and Footer workspace
    console.log('Capturing Screenshot 5: Header and Footer workspace...');
    await takeScreenshot('m4-05-header-footer-workspace');

    // 7. Open Tool 22: Date Stamp
    console.log('Step 7: Opening Date Stamp workspace...');
    await evaluate(`
      const rows = Array.from(document.querySelectorAll('.tool-subpanel-row'));
      const row = rows.find(r => r.innerText.includes('Date stamp'));
      if (row) row.click();
    `);
    await sleep(1000);

    // Screenshot 6: Date Stamp workspace
    console.log('Capturing Screenshot 6: Date Stamp workspace...');
    await takeScreenshot('m4-06-date-stamp-workspace');

    // 8. Switch to Dark Mode with Stamp workspace open
    console.log('Step 8: Switching to Dark Mode with Watermark workspace...');
    await evaluate(`
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('pdf_studio_theme', 'dark');
      const rows = Array.from(document.querySelectorAll('.tool-subpanel-row'));
      const row = rows.find(r => r.innerText.includes('Watermark'));
      if (row) row.click();
    `);
    await sleep(1000);

    // Screenshot 8: Editor in Dark Mode with a stamp workspace open
    console.log('Capturing Screenshot 8: Editor in Dark Mode with a stamp workspace open...');
    await takeScreenshot('m4-08-dark-mode-stamp-workspace');

    console.log('All 8 Milestone 4 screenshots captured successfully!');
    ws.close();
  } catch (err) {
    console.error('Error during capture:', err);
  } finally {
    edgeProc.kill('SIGKILL');
    server.close();
    process.exit(0);
  }
});

