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

server.listen(4196, '127.0.0.1', async () => {
  console.log('Static server started on http://127.0.0.1:4196');

  const edgeProc = spawn('C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', [
    '--headless=new',
    '--remote-debugging-port=9230',
    '--user-data-dir=c:\\VS Code\\Codes\\pdfstudio\\.tmp-edge-m5',
    '--window-size=1664,923',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-fre',
    '--disable-search-engine-choice-screen',
    'http://127.0.0.1:4196'
  ]);

  edgeProc.stderr.on('data', (d) => console.log('Edge stderr:', d.toString()));
  edgeProc.stdout.on('data', (d) => console.log('Edge stdout:', d.toString()));

  let tabs = null;
  for (let attempt = 0; attempt < 35; attempt++) {
    await sleep(600);
    try {
      const res = await fetch('http://127.0.0.1:9230/json');
      tabs = await res.json();
      if (tabs && tabs.length > 0) break;
    } catch {
      // Retry
    }
  }

  if (!tabs) {
    throw new Error('Failed to connect to Edge remote debugging port 9230');
  }

  try {
    const pageTab = tabs.find((t) => t.url && t.url.includes('4196')) || tabs[0];
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

    // Screenshot 1: Convert category tool list
    console.log('Capturing Screenshot 1: Convert category tool list (m5-01-convert-category-list)...');
    await takeScreenshot('m5-01-convert-category-list');

    // 3. Open Tool 23: Images to PDF
    console.log('Step 3: Selecting Images to PDF tool...');
    await evaluate(`
      const rows = Array.from(document.querySelectorAll('.tool-subpanel-row'));
      const row = rows.find(r => r.innerText.includes('Images to PDF'));
      if (row) row.click();
    `);
    await sleep(1200);

    // Populate images into queue
    console.log('Step 3b: Populating image queue with sample images...');
    await evaluate(`
      return new Promise((resolve) => {
        const createImgFile = (name, color, label, w, h) => {
          const canvas = document.createElement('canvas');
          canvas.width = w; canvas.height = h;
          const ctx = canvas.getContext('2d');
          ctx.fillStyle = color;
          ctx.fillRect(0, 0, w, h);
          ctx.fillStyle = '#FFFFFF';
          ctx.font = 'bold 24px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(label, w / 2, h / 2);
          return new Promise((res) => {
            canvas.toBlob((blob) => {
              res(new File([blob], name, { type: 'image/png' }));
            }, 'image/png');
          });
        };

        Promise.all([
          createImgFile('portfolio-slide-01.png', '#2c3e50', 'Slide 1: Portfolio', 800, 600),
          createImgFile('diagram-flowchart.png', '#16a085', 'Slide 2: Flowchart', 900, 600),
          createImgFile('project-mockup.png', '#8e44ad', 'Slide 3: Mockup', 750, 500)
        ]).then((files) => {
          const dt = new DataTransfer();
          files.forEach(f => dt.items.add(f));
          const input = document.querySelector('input[type="file"][accept*="image"]');
          if (input) {
            input.files = dt.files;
            input.dispatchEvent(new Event('change', { bubbles: true }));
          }
          setTimeout(resolve, 800);
        });
      });
    `);
    await sleep(1500);

    // Screenshot 2: Images to PDF queue
    console.log('Capturing Screenshot 2: Images to PDF queue (m5-02-images-to-pdf-queue)...');
    await takeScreenshot('m5-02-images-to-pdf-queue');

    // Screenshot 3: Images to PDF layout options & settings
    console.log('Capturing Screenshot 3: Images to PDF layout options (m5-03-images-to-pdf-layout-preview)...');
    await takeScreenshot('m5-03-images-to-pdf-layout-preview');

    // 4. Open Tool 24: PDF to Images
    console.log('Step 4: Opening PDF to Images tool...');
    await evaluate(`
      const rows = Array.from(document.querySelectorAll('.tool-subpanel-row'));
      const row = rows.find(r => r.innerText.includes('PDF to images'));
      if (row) row.click();
    `);
    await sleep(1200);

    // Screenshot 4: PDF to Images configuration workspace
    console.log('Capturing Screenshot 4: PDF to images workspace (m5-04-pdf-to-images-workspace)...');
    await takeScreenshot('m5-04-pdf-to-images-workspace');

    // 5. Run PDF to Images export
    console.log('Step 5: Executing PDF to Images conversion...');
    await evaluate(`
      const btn = Array.from(document.querySelectorAll('button.btn-primary')).find(b => b.innerText.includes('Export Pages'));
      if (btn) btn.click();
    `);
    await sleep(3500);

    // Screenshot 5: PDF to Images completion gallery & ZIP download
    console.log('Capturing Screenshot 5: PDF to images completion (m5-05-pdf-to-images-completion)...');
    await takeScreenshot('m5-05-pdf-to-images-completion');

    // 6. Open Tool 25: PDF to Text
    console.log('Step 6: Opening PDF to Text tool...');
    await evaluate(`
      const rows = Array.from(document.querySelectorAll('.tool-subpanel-row'));
      const row = rows.find(r => r.innerText.includes('PDF to text'));
      if (row) row.click();
    `);
    await sleep(1200);

    // Run text extraction
    console.log('Step 6b: Executing PDF to Text extraction...');
    await evaluate(`
      const btn = Array.from(document.querySelectorAll('button.btn-primary')).find(b => b.innerText.includes('Extract Text'));
      if (btn) btn.click();
    `);
    await sleep(2500);

    // Screenshot 6: PDF to Text preview
    console.log('Capturing Screenshot 6: PDF to text preview (m5-06-pdf-to-text-preview)...');
    await takeScreenshot('m5-06-pdf-to-text-preview');

    // Screenshot 7: PDF to Text actions and download buttons
    console.log('Capturing Screenshot 7: PDF to text download & actions (m5-07-pdf-to-text-download)...');
    await takeScreenshot('m5-07-pdf-to-text-download');

    // 7. Dark Mode with Convert tool open
    console.log('Step 7: Switching to Dark Mode...');
    await evaluate(`
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('pdf_studio_theme', 'dark');
      const rows = Array.from(document.querySelectorAll('.tool-subpanel-row'));
      const row = rows.find(r => r.innerText.includes('PDF to images'));
      if (row) row.click();
    `);
    await sleep(1500);

    // Screenshot 8: Dark mode Convert workspace
    console.log('Capturing Screenshot 8: Dark mode Convert workspace (m5-08-dark-mode-convert-workspace)...');
    await takeScreenshot('m5-08-dark-mode-convert-workspace');

    console.log('All 8 Milestone 5 screenshots captured successfully!');
    ws.close();
  } catch (err) {
    console.error('Error during capture:', err);
  } finally {
    edgeProc.kill('SIGKILL');
    server.close();
    process.exit(0);
  }
});
