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

server.listen(4176, '127.0.0.1', async () => {
  console.log('Static server started on http://127.0.0.1:4176');

  const edgeProc = spawn('C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', [
    '--headless=new',
    '--remote-debugging-port=9227',
    '--user-data-dir=c:\\VS Code\\Codes\pdfstudio\\.tmp-edge-m2',
    '--window-size=1664,923',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-fre',
    '--disable-search-engine-choice-screen',
    'http://127.0.0.1:4176'
  ]);

  await sleep(2500);

  try {
    const tabs = await (await fetch('http://127.0.0.1:9227/json')).json();
    const pageTab = tabs.find((t) => t.url && t.url.includes('4176')) || tabs[0];
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

    await new Promise((r) => (ws.onopen = r));
    await sleep(1500);

    const saveScreenshot = async (filename) => {
      const shot = await send('Page.captureScreenshot', { format: 'png' });
      const dest = path.join(outDir, filename);
      fs.writeFileSync(dest, Buffer.from(shot.result.data, 'base64'));
      console.log(`✓ Saved: ${filename}`);
    };

    const setViewport = async (width, height) => {
      await send('Emulation.setDeviceMetricsOverride', {
        width,
        height,
        deviceScaleFactor: 1,
        mobile: false
      });
      await sleep(500);
    };

    await setViewport(1664, 923);

    // Click "Try Sample" to open document in editor
    console.log('Loading Sample PDF into Editor...');
    await send('Runtime.evaluate', {
      expression: `(() => {
        const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Try Sample'));
        if (btn) btn.click();
      })()`,
      returnByValue: true
    });

    // Wait for PDF sheet card to appear
    for (let i = 0; i < 15; i++) {
      await sleep(500);
      const check = await send('Runtime.evaluate', {
        expression: `!!document.querySelector('.pdf-sheet-card canvas')`,
        returnByValue: true
      });
      if (check?.result?.result?.value) {
        console.log('PDF Canvas successfully rendered in workspace!');
        break;
      }
    }
    await sleep(1200);

    // 1. Organise workspace overview (no tool panel open yet)
    console.log('1. Capturing Organise Workspace overview...');
    await saveScreenshot('m2-01-organise-workspace.png');

    // Helper function to click a tool in the sidebar subpanel
    const selectTool = async (toolName) => {
      await send('Runtime.evaluate', {
        expression: `(() => {
          const rows = Array.from(document.querySelectorAll('.tool-subpanel-row'));
          const target = rows.find(r => r.textContent.includes('${toolName}'));
          if (target) target.click();
        })()`,
        returnByValue: true
      });
      await sleep(800);
    };

    // 2. Merge interface
    console.log('2. Capturing Merge interface...');
    await selectTool('Merge');
    await saveScreenshot('m2-02-merge-panel.png');

    // 3. Split interface
    console.log('3. Capturing Split interface...');
    await selectTool('Split');
    await saveScreenshot('m2-03-split-panel.png');

    // 4. Reorder interface
    console.log('4. Capturing Reorder interface...');
    await selectTool('Reorder');
    // Move page 1 down once to show active modification
    await send('Runtime.evaluate', {
      expression: `(() => {
        const btn = document.querySelector('.reorder-item-card button[title="Move Later"]');
        if (btn) btn.click();
      })()`,
      returnByValue: true
    });
    await sleep(500);
    await saveScreenshot('m2-04-reorder-panel.png');

    // 5. Rotate interface
    console.log('5. Capturing Rotate interface...');
    await selectTool('Rotate');
    await saveScreenshot('m2-05-rotate-panel.png');

    // 6. Delete interface
    console.log('6. Capturing Delete interface...');
    await selectTool('Delete');
    await saveScreenshot('m2-06-delete-panel.png');

    // 7. Duplicate interface
    console.log('7. Capturing Duplicate interface...');
    await selectTool('Duplicate');
    await saveScreenshot('m2-07-duplicate-panel.png');

    // 8. Extract interface
    console.log('8. Capturing Extract interface...');
    await selectTool('Extract');
    await saveScreenshot('m2-08-extract-panel.png');

    // 9. Insert Blank Page interface
    console.log('9. Capturing Insert Blank Page interface...');
    await selectTool('Insert blank page');
    await saveScreenshot('m2-09-insert-blank-panel.png');

    // 10. Crop interface
    console.log('10. Capturing Crop interface...');
    await selectTool('Crop');
    await saveScreenshot('m2-10-crop-panel.png');

    console.log('\n======================================================');
    console.log('ALL 10 MILESTONE 2 SCREENSHOTS CAPTURED SUCCESSFULLY!');
    console.log('======================================================');

    ws.close();
  } catch (err) {
    console.error('Capture Error:', err);
  } finally {
    edgeProc.kill('SIGKILL');
    server.close();
    await sleep(1000);
    try {
      if (fs.existsSync('c:\\VS Code\\Codes\\pdfstudio\\.tmp-edge-m2')) {
        fs.rmSync('c:\\VS Code\\Codes\\pdfstudio\\.tmp-edge-m2', { recursive: true, force: true });
      }
    } catch (e) {}
    process.exit(0);
  }
});

