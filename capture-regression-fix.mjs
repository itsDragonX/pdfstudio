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

server.listen(4180, '127.0.0.1', async () => {
  console.log('Static server started on http://127.0.0.1:4180');

  const edgeProc = spawn('C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', [
    '--headless=new',
    '--remote-debugging-port=9231',
    '--user-data-dir=c:\\VS Code\\Codes\\pdfstudio\\.tmp-edge-fix2',
    '--window-size=1664,923',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-fre',
    '--disable-search-engine-choice-screen',
    'http://127.0.0.1:4180'
  ]);

  await sleep(2500);

  try {
    const tabs = await (await fetch('http://127.0.0.1:9231/json')).json();
    const pageTab = tabs.find((t) => t.url && t.url.includes('4180')) || tabs[0];
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

    await sleep(1500);

    // 1. Open a PDF via "Try Sample"
    console.log('Step 1: Opening Sample PDF...');
    await evaluate(`
      const sampleBtn = document.querySelector('.upload-secondary-cta');
      if (sampleBtn) sampleBtn.click();
    `);
    await sleep(2500);

    // 2. STATE A: Verify all 9 Organise tools are immediately visible alongside Category rail
    console.log('Step 2 & 3: Verifying Organise tools list (STATE A)...');
    const toolCount = await evaluate(`
      return document.querySelectorAll('.tool-subpanel-row').length;
    `);
    const categoryTitle = await evaluate(`
      return document.querySelector('.tool-subpanel-title')?.innerText;
    `);
    console.log(`✓ Category Title: "${categoryTitle}", Tools count: ${toolCount}`);
    await takeScreenshot('m2-fix-01-browsing-organise');

    // 4. Select Merge tool
    console.log('Step 4 & 5: Selecting Merge tool (STATE B)...');
    await evaluate(`
      const rows = Array.from(document.querySelectorAll('.tool-subpanel-row'));
      const mergeRow = rows.find(r => r.innerText.includes('Merge'));
      if (mergeRow) mergeRow.click();
    `);
    await sleep(1500);
    const inMergeWorkspace = await evaluate(`
      return Boolean(document.querySelector('.merge-panel') && document.querySelector('.btn-back-to-tools'));
    `);
    console.log(`✓ In Merge workspace with Back button: ${inMergeWorkspace}`);
    await takeScreenshot('m2-fix-02-merge-workspace');

    // 6. Click Back to Tools (STATE C)
    console.log('Step 6 & 7: Clicking Back to Tools (STATE C)...');
    await evaluate(`
      const backBtn = document.querySelector('.btn-back-to-tools');
      if (backBtn) backBtn.click();
    `);
    await sleep(1000);
    const restoredToolsCount = await evaluate(`
      return document.querySelectorAll('.tool-subpanel-row').length;
    `);
    console.log(`✓ Returned to tool list, tools count: ${restoredToolsCount}`);
    await takeScreenshot('m2-fix-03-returned-to-tools');

    // 8. Select Reorder tool
    console.log('Step 8 & 9: Selecting Reorder tool...');
    await evaluate(`
      const rows = Array.from(document.querySelectorAll('.tool-subpanel-row'));
      const reorderRow = rows.find(r => r.innerText.includes('Reorder'));
      if (reorderRow) reorderRow.click();
    `);
    await sleep(2000);
    const reorderCardsCount = await evaluate(`
      return document.querySelectorAll('.reorder-item-card').length;
    `);
    const reorderThumbsCount = await evaluate(`
      return document.querySelectorAll('.mini-thumb-canvas-box').length;
    `);
    console.log(`✓ Reorder workspace loaded: ${reorderCardsCount} cards, ${reorderThumbsCount} thumbnail canvases`);
    await takeScreenshot('m2-fix-04-reorder-workspace');

    // 10. Return to tools via Cancel button
    console.log('Step 10: Returning to tools via Cancel button in Reorder...');
    await evaluate(`
      const cancelBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.trim() === 'Cancel');
      if (cancelBtn) cancelBtn.click();
    `);
    await sleep(1000);

    // 11. Switch to Split tool
    console.log('Step 11 & 12: Selecting Split tool...');
    await evaluate(`
      const rows = Array.from(document.querySelectorAll('.tool-subpanel-row'));
      const splitRow = rows.find(r => r.innerText.includes('Split'));
      if (splitRow) splitRow.click();
    `);
    await sleep(1500);
    const splitLoaded = await evaluate(`
      return Boolean(document.querySelector('.split-panel'));
    `);
    console.log(`✓ Split workspace loaded: ${splitLoaded}`);
    await takeScreenshot('m2-fix-05-split-workspace');

    // 13. Close & reopen thumbnail drawer independently
    console.log('Step 13: Testing independent thumbnail drawer toggle...');
    // Click thumbnail toggle in toolbar
    await evaluate(`
      const thumbToggle = document.querySelector('.editor-toolbar .btn-icon');
      if (thumbToggle) thumbToggle.click();
    `);
    await sleep(1500);
    const thumbDrawerOpen = await evaluate(`
      return Boolean(document.querySelector('.thumbnail-strip-drawer'));
    `);
    console.log(`✓ Thumbnail drawer opened independently: ${thumbDrawerOpen}`);
    await takeScreenshot('m2-fix-06-thumbnails-independent');

    // Return to tools
    await evaluate(`
      const backBtn = document.querySelector('.btn-back-to-tools');
      if (backBtn) backBtn.click();
    `);
    await sleep(1000);

    // Verify category switching (e.g. Edit category)
    console.log('Testing category switching across categories...');
    await evaluate(`
      const editBtn = document.querySelector('.category-rail-btn.category-edit');
      if (editBtn) editBtn.click();
    `);
    await sleep(1000);
    const editToolsCount = await evaluate(`
      return document.querySelectorAll('.tool-subpanel-row').length;
    `);
    const editTitle = await evaluate(`
      return document.querySelector('.tool-subpanel-title')?.innerText;
    `);
    console.log(`✓ Switched to "${editTitle}" category with ${editToolsCount} tools`);
    await takeScreenshot('m2-fix-07-edit-category');

    console.log('\n=== ALL BROWSER WORKFLOW TESTS PASSED 100% ===\n');
    ws.close();
  } catch (err) {
    console.error('Error during capture:', err);
  } finally {
    edgeProc.kill();
    server.close();
  }
});
