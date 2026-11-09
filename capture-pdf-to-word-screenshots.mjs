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

server.listen(4197, '127.0.0.1', async () => {
  console.log('Static server started on http://127.0.0.1:4197');

  const edgeProc = spawn('C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', [
    '--headless=new',
    '--remote-debugging-port=9235',
    '--user-data-dir=c:\\VS Code\\Codes\\pdfstudio\\.tmp-edge-word',
    '--window-size=1664,923',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-fre',
    '--disable-search-engine-choice-screen',
    'http://127.0.0.1:4197'
  ]);

  let tabs = null;
  for (let attempt = 0; attempt < 35; attempt++) {
    await sleep(600);
    try {
      const res = await fetch('http://127.0.0.1:9235/json');
      tabs = await res.json();
      if (tabs && tabs.length > 0) break;
    } catch {
      // Retry
    }
  }

  if (!tabs) {
    throw new Error('Failed to connect to Edge remote debugging port 9235');
  }

  try {
    const pageTab = tabs.find((t) => t.url && t.url.includes('4197')) || tabs[0];
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

    // 2. Click Convert Category in Rail
    console.log('Step 2: Switching to Convert category...');
    await evaluate(`
      const convertBtn = document.querySelector('.category-rail-btn.category-convert');
      if (convertBtn) convertBtn.click();
    `);
    await sleep(1000);

    // Screenshot 1: Sidebar with all 4 tools including PDF to Word
    console.log('Capturing Screenshot 1: Convert category sidebar with 4 tools (m5-word-01-sidebar-pdf-to-word)...');
    await takeScreenshot('m5-word-01-sidebar-pdf-to-word');

    // 3. Open Tool: PDF to Word
    console.log('Step 3: Selecting PDF to Word tool...');
    await evaluate(`
      const rows = Array.from(document.querySelectorAll('.tool-subpanel-row'));
      const row = rows.find(r => r.innerText.includes('PDF to Word'));
      if (row) row.click();
    `);
    await sleep(1200);

    // 4. Click "Analyze Document Structure" button
    console.log('Step 4: Executing Analyze Document Structure...');
    await evaluate(`
      const analyzeBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Analyze Document Structure'));
      if (analyzeBtn) analyzeBtn.click();
    `);
    await sleep(3000);

    // Screenshot 2: Analysis overview with stats
    console.log('Capturing Screenshot 2: PDF to Word analysis overview (m5-word-02-analysis-overview)...');
    await takeScreenshot('m5-word-02-analysis-overview');

    // Screenshot 3: Structure preview with headings & paragraphs
    console.log('Capturing Screenshot 3: PDF to Word structure preview (m5-word-03-structure-preview)...');
    await takeScreenshot('m5-word-03-structure-preview');

    // 5. Expand limitations accordion
    console.log('Step 5: Expanding limitations notice...');
    await evaluate(`
      const limitsBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Capabilities & Limits'));
      if (limitsBtn) limitsBtn.click();
    `);
    await sleep(800);

    // Screenshot 5: Capabilities & formatting limitations callout
    console.log('Capturing Screenshot 5: Capabilities & limitations accordion (m5-word-05-limitations-accordion)...');
    await takeScreenshot('m5-word-05-limitations-accordion');

    // 6. Click "Convert & Download DOCX"
    console.log('Step 6: Executing Convert & Download DOCX...');
    await evaluate(`
      const convertBtn = Array.from(document.querySelectorAll('button.btn-primary')).find(b => b.innerText.includes('Convert & Download DOCX'));
      if (convertBtn) convertBtn.click();
    `);
    await sleep(3500);

    // Screenshot 4: DOCX conversion completion banner and download button
    console.log('Capturing Screenshot 4: DOCX conversion completion (m5-word-04-docx-completion)...');
    await takeScreenshot('m5-word-04-docx-completion');

    // 7. Dark Mode with PDF to Word workspace open
    console.log('Step 7: Switching to Dark Mode...');
    await evaluate(`
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('pdf_studio_theme', 'dark');
    `);
    await sleep(1200);

    // Screenshot 6: Dark mode PDF to Word workspace
    console.log('Capturing Screenshot 6: Dark mode PDF to Word workspace (m5-word-06-dark-mode-workspace)...');
    await takeScreenshot('m5-word-06-dark-mode-workspace');

    console.log('All PDF to Word screenshots captured successfully!');
    ws.close();
  } catch (err) {
    console.error('Error during capture:', err);
  } finally {
    edgeProc.kill('SIGKILL');
    server.close();
    process.exit(0);
  }
});

