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

server.listen(4175, '127.0.0.1', async () => {
  console.log('Static server started on http://127.0.0.1:4175');

  const edgeProc = spawn('C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', [
    '--headless=new',
    '--remote-debugging-port=9226',
    '--user-data-dir=c:\\VS Code\\Codes\\pdfstudio\\.tmp-edge-apple',
    '--window-size=1664,923',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-fre',
    '--disable-search-engine-choice-screen',
    'http://127.0.0.1:4175'
  ]);

  await sleep(2500);

  try {
    const tabs = await (await fetch('http://127.0.0.1:9226/json')).json();
    const pageTab = tabs.find((t) => t.url && t.url.includes('4175')) || tabs[0];
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

    const setViewport = async (width, height, isMobile = false) => {
      await send('Emulation.setDeviceMetricsOverride', {
        width,
        height,
        deviceScaleFactor: 1,
        mobile: isMobile
      });
      await sleep(600);
    };

    const clickThemeBtn = async (title) => {
      await send('Runtime.evaluate', {
        expression: `(() => {
          const btn = document.querySelector('button[title="${title}"]');
          if (btn) btn.click();
          return document.documentElement.getAttribute('data-theme');
        })()`,
        returnByValue: true
      });
      await sleep(600);
    };

    // 1. Home screen — Light mode (1664x923)
    console.log('1. Capturing Home — Light mode (1664x923)...');
    await setViewport(1664, 923);
    await clickThemeBtn('Light theme');
    await saveScreenshot('1-home-light.png');

    // 2. Home screen — Dark mode (1664x923)
    console.log('2. Capturing Home — Dark mode (1664x923)...');
    await clickThemeBtn('Dark theme');
    await saveScreenshot('2-home-dark.png');

    // 3. Home screen — System mode (1664x923)
    console.log('3. Capturing Home — System mode (1664x923)...');
    await clickThemeBtn('Match system theme');
    await saveScreenshot('3-home-system.png');

    // Load PDF Document via "Try Sample"
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
    await sleep(1000);

    // 4. PDF editor — Light mode (1664x923)
    console.log('4. Capturing Editor — Light mode (1664x923)...');
    await clickThemeBtn('Light theme');
    await saveScreenshot('4-editor-light.png');

    // 5. PDF editor — Dark mode (1664x923, with PDF canvas strictly untouched white)
    console.log('5. Capturing Editor — Dark mode (1664x923)...');
    await clickThemeBtn('Dark theme');
    await saveScreenshot('5-editor-dark.png');

    // 6. Editor with Organise tools visible (1664x923)
    console.log('6. Capturing Editor with Organise tools visible (1664x923)...');
    await clickThemeBtn('Light theme');
    await send('Runtime.evaluate', {
      expression: `(() => {
        const orgBtn = document.querySelector('.category-rail-btn');
        if (orgBtn) orgBtn.click();
      })()`,
      returnByValue: true
    });
    await sleep(600);
    await saveScreenshot('6-editor-organise-tools.png');

    // 7. Editor with contextual properties panel expanded (1664x923)
    console.log('7. Capturing Editor with Contextual Properties Panel expanded (1664x923)...');
    await send('Runtime.evaluate', {
      expression: `(() => {
        const toolRow = document.querySelector('.tool-subpanel-row');
        if (toolRow) toolRow.click();
      })()`,
      returnByValue: true
    });
    await sleep(800);
    await saveScreenshot('7-editor-properties-panel.png');

    // Close document to return to Home Screen
    console.log('Closing document for mobile home capture...');
    await send('Runtime.evaluate', {
      expression: `(() => {
        const closePropBtn = document.querySelector('.contextual-drawer-header button');
        if (closePropBtn) closePropBtn.click();
        const closeBtn = document.querySelector('.app-header .btn-ghost[title="Close document"]') ||
                         document.querySelector('.app-header .header-brand');
        if (closeBtn) closeBtn.click();
      })()`,
      returnByValue: true
    });
    await sleep(1500);

    // 8. Mobile home screen (390x844)
    console.log('8. Capturing Mobile Home Screen (390x844)...');
    await setViewport(390, 844, true);
    await clickThemeBtn('Light theme');
    await saveScreenshot('8-mobile-home.png');

    // 9. Mobile PDF viewer (390x844)
    console.log('9. Capturing Mobile PDF Viewer (390x844)...');
    await send('Runtime.evaluate', {
      expression: `(() => {
        const tryBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Try Sample'));
        if (tryBtn) tryBtn.click();
      })()`,
      returnByValue: true
    });

    for (let i = 0; i < 15; i++) {
      await sleep(500);
      const check = await send('Runtime.evaluate', {
        expression: `!!document.querySelector('.pdf-sheet-card canvas')`,
        returnByValue: true
      });
      if (check?.result?.result?.value) {
        console.log('Mobile PDF Canvas rendered!');
        break;
      }
    }
    await send('Runtime.evaluate', {
      expression: `(() => {
        window.dispatchEvent(new Event('resize'));
        const fitBtn = document.querySelector('button[title="Fit to Width"]');
        if (fitBtn) fitBtn.click();
      })()`,
      returnByValue: true
    });
    await sleep(1000);
    await saveScreenshot('9-mobile-editor.png');

    console.log('\n======================================================');
    console.log('ALL 9 APPLE GLASS REDESIGN SCREENSHOTS CAPTURED!');
    console.log('======================================================');

    ws.close();
  } catch (err) {
    console.error('Capture Error:', err);
  } finally {
    edgeProc.kill('SIGKILL');
    server.close();
    await sleep(1000);
    try {
      if (fs.existsSync('c:\\VS Code\\Codes\\pdfstudio\\.tmp-edge-apple')) {
        fs.rmSync('c:\\VS Code\\Codes\\pdfstudio\\.tmp-edge-apple', { recursive: true, force: true });
      }
    } catch (e) {}
    process.exit(0);
  }
});
