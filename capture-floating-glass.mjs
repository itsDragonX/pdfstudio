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

server.listen(4188, '127.0.0.1', async () => {
  console.log('Static server started on http://127.0.0.1:4188');

  const edgeProc = spawn('C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', [
    '--headless=new',
    '--remote-debugging-port=9226',
    '--user-data-dir=c:\\VS Code\\Codes\\pdfstudio\\.tmp-edge-floating-glass',
    '--window-size=1664,923',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-fre',
    '--disable-search-engine-choice-screen',
    'http://127.0.0.1:4188'
  ]);

  let tabs = null;
  for (let attempt = 0; attempt < 25; attempt++) {
    await sleep(600);
    try {
      const res = await fetch('http://127.0.0.1:9226/json');
      tabs = await res.json();
      if (tabs && tabs.length > 0) break;
    } catch {
      // Retry
    }
  }

  if (!tabs) {
    throw new Error('Failed to connect to Edge remote debugging port 9226');
  }

  try {
    const pageTab = tabs.find((t) => t.url && t.url.includes('4188')) || tabs[0];
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

    // 2. Set Dark Theme
    console.log('Step 2: Activating Dark Theme...');
    await evaluate(`
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('pdf_studio_theme', 'dark');
    `);
    await sleep(600);

    // 3. Switch to Edit Category in Segmented Track
    console.log('Step 3: Selecting Edit Category...');
    await evaluate(`
      const editBtn = document.querySelector('.category-rail-btn.category-edit');
      if (editBtn) editBtn.click();
    `);
    await sleep(800);

    // 4. Click "Add text" tool
    console.log('Step 4: Selecting "Add text" tool to open Right Inspector...');
    await evaluate(`
      const rows = Array.from(document.querySelectorAll('.tool-subpanel-row'));
      const textRow = rows.find(r => r.innerText.includes('Add text'));
      if (textRow) textRow.click();
    `);
    await sleep(1000);

    // 5. Inspect the <select> background in Dark Mode to guarantee no white box
    const selectStyles = await evaluate(`
      const sel = document.querySelector('#text-target-page') || document.querySelector('select');
      if (!sel) return { found: false };
      const comp = window.getComputedStyle(sel);
      return {
        found: true,
        bg: comp.backgroundColor,
        color: comp.color,
        border: comp.borderColor,
        appearance: comp.appearance || comp.webkitAppearance
      };
    `);
    console.log('Dark mode <select> computed styles:', JSON.stringify(selectStyles));

    // Screenshot 1: Dark theme Floating Glass Workspace
    console.log('Capturing Screenshot 1: Floating Glass Workspace (Dark Theme)...');
    await takeScreenshot('floating-glass-workspace-dark');

    // Screenshot 2: Light Theme Floating Glass Workspace
    console.log('Step 5: Switching to Light Theme...');
    await evaluate(`
      document.documentElement.setAttribute('data-theme', 'light');
      localStorage.setItem('pdf_studio_theme', 'light');
    `);
    await sleep(800);
    console.log('Capturing Screenshot 2: Floating Glass Workspace (Light Theme)...');
    await takeScreenshot('floating-glass-workspace-light');

    // Screenshot 3: Organise Category & Merge Active
    console.log('Step 6: Switching back to Dark Theme and Organise -> Merge...');
    await evaluate(`
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('pdf_studio_theme', 'dark');
      const orgBtn = document.querySelector('.category-rail-btn.category-organise');
      if (orgBtn) orgBtn.click();
    `);
    await sleep(600);
    await evaluate(`
      const rows = Array.from(document.querySelectorAll('.tool-subpanel-row'));
      const mergeRow = rows.find(r => r.innerText.includes('Merge'));
      if (mergeRow) mergeRow.click();
    `);
    await sleep(1000);
    console.log('Capturing Screenshot 3: Floating Glass Workspace (Merge Tool Active)...');
    await takeScreenshot('floating-glass-organise-merge');

    console.log('All Floating Glass screenshots captured successfully!');
    ws.close();
  } catch (err) {
    console.error('Error during capture:', err);
  } finally {
    edgeProc.kill('SIGKILL');
    server.close();
    process.exit(0);
  }
});

