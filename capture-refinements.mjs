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

server.listen(4177, '127.0.0.1', async () => {
  console.log('Static server started on http://127.0.0.1:4177');

  const edgeProc = spawn('C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', [
    '--headless=new',
    '--remote-debugging-port=9228',
    '--user-data-dir=c:\\VS Code\\Codes\\pdfstudio\\.tmp-edge-refine',
    '--window-size=1664,923',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-fre',
    '--disable-search-engine-choice-screen',
    'http://127.0.0.1:4177'
  ]);

  await sleep(2500);

  try {
    const tabs = await (await fetch('http://127.0.0.1:9228/json')).json();
    const pageTab = tabs.find((t) => t.url && t.url.includes('4177')) || tabs[0];
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
      const res = await send('Runtime.evaluate', { expression: expr, awaitPromise: true });
      return res.result?.value;
    };

    await sleep(1500);

    // 1. Home Screen (Clean Showcase without Milestone badges)
    console.log('Capturing Home Screen...');
    await takeScreenshot('m2-refine-01-home');

    // 2. Click "Try Sample" to load PDF
    console.log('Opening Sample PDF...');
    await evaluate(`
      const sampleBtn = document.querySelector('.upload-secondary-cta');
      if (sampleBtn) sampleBtn.click();
    `);
    await sleep(2500);

    // 2. Maximized Canvas (Only 58px category rail, 0px subpanel, 0px thumbnails, 0px inspector)
    console.log('Capturing Maximized Canvas...');
    await takeScreenshot('m2-refine-02-maximized-canvas');

    // 3. Click "Organise" on the 58px rail to toggle open the tools drawer
    console.log('Opening Tools Drawer...');
    await evaluate(`
      const orgBtn = document.querySelector('.category-rail-btn.category-organise');
      if (orgBtn) orgBtn.click();
    `);
    await sleep(1000);
    await takeScreenshot('m2-refine-03-tools-drawer');

    // 4. Click "Merge" tool
    console.log('Selecting Merge Tool...');
    await evaluate(`
      const rows = Array.from(document.querySelectorAll('.tool-subpanel-row'));
      const mergeRow = rows.find(r => r.innerText.includes('Merge'));
      if (mergeRow) mergeRow.click();
    `);
    await sleep(1200);
    await takeScreenshot('m2-refine-04-merge-panel');

    // 5. Test "Back to tools" button in Contextual Panel
    console.log('Testing "Back to tools" button...');
    await evaluate(`
      const backBtn = document.querySelector('.contextual-back-btn');
      if (backBtn) backBtn.click();
    `);
    await sleep(1000);
    await takeScreenshot('m2-refine-05-back-to-tools');

    // 6. Select "Reorder" tool (should show thumbnails)
    console.log('Selecting Reorder Tool...');
    await evaluate(`
      const rows = Array.from(document.querySelectorAll('.tool-subpanel-row'));
      const reorderRow = rows.find(r => r.innerText.includes('Reorder'));
      if (reorderRow) reorderRow.click();
    `);
    await sleep(1500);
    await takeScreenshot('m2-refine-06-reorder-view');

    // 7. Select "Rotate" tool
    console.log('Selecting Rotate Tool...');
    await evaluate(`
      // First go back to tools
      const backBtn = document.querySelector('.contextual-back-btn');
      if (backBtn) backBtn.click();
    `);
    await sleep(800);
    await evaluate(`
      const rows = Array.from(document.querySelectorAll('.tool-subpanel-row'));
      const rotateRow = rows.find(r => r.innerText.includes('Rotate'));
      if (rotateRow) rotateRow.click();
    `);
    await sleep(1200);
    await takeScreenshot('m2-refine-07-rotate-panel');

    console.log('All screenshots captured successfully!');
    ws.close();
  } catch (err) {
    console.error('Error during capture:', err);
  } finally {
    edgeProc.kill();
    server.close();
  }
});

