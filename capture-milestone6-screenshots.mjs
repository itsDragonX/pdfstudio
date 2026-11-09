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

server.listen(4198, '127.0.0.1', async () => {
  console.log('Static server started on http://127.0.0.1:4198');

  const edgeProc = spawn('C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', [
    '--headless=new',
    '--remote-debugging-port=9240',
    '--user-data-dir=c:\\VS Code\\Codes\\pdfstudio\\.tmp-edge-m6',
    '--window-size=1664,923',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-fre',
    '--disable-search-engine-choice-screen',
    'http://127.0.0.1:4198'
  ]);

  let tabs = null;
  for (let attempt = 0; attempt < 35; attempt++) {
    await sleep(600);
    try {
      const res = await fetch('http://127.0.0.1:9240/json');
      tabs = await res.json();
      if (tabs && tabs.length > 0) break;
    } catch {
      // Retry
    }
  }

  if (!tabs) {
    throw new Error('Failed to connect to Edge remote debugging port 9240');
  }

  try {
    const pageTab = tabs.find((t) => t.url && t.url.includes('4198')) || tabs[0];
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

    // 2. Click Finish Category in Rail
    console.log('Step 2: Switching to Finish category...');
    await evaluate(`
      const finishBtn = document.querySelector('.category-rail-btn.category-finish');
      if (finishBtn) finishBtn.click();
    `);
    await sleep(1000);

    // Screenshot 1: Finish category tool list
    console.log('Capturing Screenshot 1: Finish category tool list (m6-01-finish-category-list)...');
    await takeScreenshot('m6-01-finish-category-list');

    // 3. Open Tool 1: Compress PDF
    console.log('Step 3: Selecting Compress tool...');
    await evaluate(`
      const rows = Array.from(document.querySelectorAll('.tool-subpanel-row'));
      const row = rows.find(r => r.innerText.includes('Compress'));
      if (row) row.click();
    `);
    await sleep(1200);

    // Screenshot 2: Compress PDF panel
    console.log('Capturing Screenshot 2: Compress PDF panel (m6-02-compress-panel)...');
    await takeScreenshot('m6-02-compress-panel');

    // 4. Open Tool 2: Edit Details
    console.log('Step 4: Selecting Edit details tool...');
    await evaluate(`
      const rows = Array.from(document.querySelectorAll('.tool-subpanel-row'));
      const row = rows.find(r => r.innerText.includes('Edit details'));
      if (row) row.click();
    `);
    await sleep(1200);

    // Screenshot 3: Edit Details panel
    console.log('Capturing Screenshot 3: Edit details panel (m6-03-edit-details-panel)...');
    await takeScreenshot('m6-03-edit-details-panel');

    // 5. Open Tool 3: Remove Details
    console.log('Step 5: Selecting Remove details tool...');
    await evaluate(`
      const rows = Array.from(document.querySelectorAll('.tool-subpanel-row'));
      const row = rows.find(r => r.innerText.includes('Remove details'));
      if (row) row.click();
    `);
    await sleep(1200);

    // Screenshot 4: Remove Details panel
    console.log('Capturing Screenshot 4: Remove details panel (m6-04-remove-details-panel)...');
    await takeScreenshot('m6-04-remove-details-panel');

    // 6. Open Tool 4: Compare PDFs
    console.log('Step 6: Selecting Compare tool...');
    await evaluate(`
      const rows = Array.from(document.querySelectorAll('.tool-subpanel-row'));
      const row = rows.find(r => r.innerText.includes('Compare'));
      if (row) row.click();
    `);
    await sleep(1200);

    // Screenshot 5: Compare setup panel
    console.log('Capturing Screenshot 5: Compare setup panel (m6-05-compare-panel-setup)...');
    await takeScreenshot('m6-05-compare-panel-setup');

    // Simulate selecting Doc B as copy of sample doc for comparison demo
    console.log('Step 6b: Executing comparison demo...');
    await evaluate(`
      return new Promise((resolve) => {
        // Fetch sample pdf bytes directly and trigger compare
        fetch('./sample.pdf').then(r => r.blob()).then(blob => {
          const dt = new DataTransfer();
          dt.items.add(new File([blob], 'Revision-B-2026.pdf', { type: 'application/pdf' }));
          const inputs = document.querySelectorAll('input[type=\"file\"][accept*=\"pdf\"]');
          if (inputs.length >= 2) {
            inputs[1].files = dt.files;
            inputs[1].dispatchEvent(new Event('change', { bubbles: true }));
          }
          setTimeout(() => {
            const btn = Array.from(document.querySelectorAll('button.btn-primary')).find(b => b.innerText.includes('Compare'));
            if (btn) btn.click();
            setTimeout(resolve, 2500);
          }, 800);
        });
      });
    `);
    await sleep(3500);

    // Screenshot 6: Compare results dashboard & viewer
    console.log('Capturing Screenshot 6: Compare results dashboard (m6-06-compare-panel-results)...');
    await takeScreenshot('m6-06-compare-panel-results');

    // 7. Dark Mode with Finish tool active
    console.log('Step 7: Switching to Dark Mode...');
    await evaluate(`
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('pdf_studio_theme', 'dark');
      const rows = Array.from(document.querySelectorAll('.tool-subpanel-row'));
      const row = rows.find(r => r.innerText.includes('Compress'));
      if (row) row.click();
    `);
    await sleep(1200);

    // Screenshot 7: Dark mode Finish workspace
    console.log('Capturing Screenshot 7: Dark mode Finish workspace (m6-07-dark-mode-finish-workspace)...');
    await takeScreenshot('m6-07-dark-mode-finish-workspace');

    console.log('All 7 Milestone 6 screenshots captured successfully!');
    ws.close();
  } catch (err) {
    console.error('Error during capture:', err);
  } finally {
    edgeProc.kill('SIGKILL');
    server.close();
    process.exit(0);
  }
});

