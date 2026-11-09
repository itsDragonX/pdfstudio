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

server.listen(4178, '127.0.0.1', async () => {
  console.log('Static server started on http://127.0.0.1:4178');

  const edgeProc = spawn('C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', [
    '--headless=new',
    '--remote-debugging-port=9225',
    '--user-data-dir=c:\\VS Code\\Codes\\pdfstudio\\.tmp-edge-diag3',
    '--window-size=1664,923',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-fre',
    '--disable-search-engine-choice-screen',
    'http://127.0.0.1:4178'
  ]);

  let tabs = null;
  for (let attempt = 0; attempt < 25; attempt++) {
    await sleep(600);
    try {
      const res = await fetch('http://127.0.0.1:9225/json');
      tabs = await res.json();
      if (tabs && tabs.length > 0) break;
    } catch {
      // Retry
    }
  }

  if (!tabs) {
    throw new Error('Failed to connect to Edge remote debugging port 9225');
  }

  try {
    const pageTab = tabs.find((t) => t.url && t.url.includes('4178')) || tabs[0];
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

    const nativeDrag = async (x1, y1, x2, y2) => {
      await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: Math.round(x1), y: Math.round(y1) });
      await sleep(50);
      await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: Math.round(x1), y: Math.round(y1), button: 'left', clickCount: 1 });
      await sleep(100);
      await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: Math.round((x1 * 2 + x2) / 3), y: Math.round((y1 * 2 + y2) / 3) });
      await sleep(100);
      await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: Math.round((x1 + x2 * 2) / 3), y: Math.round((y1 + y2 * 2) / 3) });
      await sleep(100);
      await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: Math.round(x2), y: Math.round(y2) });
      await sleep(100);
      await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: Math.round(x2), y: Math.round(y2), button: 'left', clickCount: 1 });
      await sleep(300);
    };

    const getPageBox = async () => {
      return evaluate(`
        const el = document.querySelector('#page-wrapper-1');
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return { x: r.left, y: r.top, w: r.width, h: r.height };
      `);
    };

    await sleep(2000);

    // 1. Open Sample Document
    console.log('Step 1: Opening sample document...');
    await evaluate(`
      const sampleBtn = document.querySelector('.upload-secondary-cta');
      if (sampleBtn) sampleBtn.click();
    `);
    await sleep(2500);

    // 2. Click Edit Category in Rail
    console.log('Step 2: Switching to Edit Category in Category Rail...');
    await evaluate(`
      const editRailBtn = document.querySelector('.category-rail-btn.category-edit');
      if (editRailBtn) editRailBtn.click();
    `);
    await sleep(1200);

    // Screenshot 1: Edit Category Browsing Mode (all 9 tools visible)
    console.log('Capturing Screenshot 1: Edit Category Browsing Mode...');
    const editToolsCount = await evaluate(`
      return document.querySelectorAll('.tool-subpanel-row').length;
    `);
    const editTitle = await evaluate(`
      return document.querySelector('.tool-subpanel-title')?.innerText;
    `);
    console.log(`✓ Edit category active: "${editTitle}" with ${editToolsCount} tools`);
    await takeScreenshot('m3-01-edit-category-browsing');

    // 3. Tool 1: Add Text
    console.log('Step 3: Opening Add Text tool...');
    await evaluate(`
      const rows = Array.from(document.querySelectorAll('.tool-subpanel-row'));
      const textRow = rows.find(r => r.innerText.includes('Add text'));
      if (textRow) textRow.click();
    `);
    await sleep(1200);

    // Modify text content to show rich editing
    await evaluate(`
      const textarea = document.querySelector('#text-content-input');
      if (textarea) {
        textarea.value = 'PDF Studio Pro · Document Approved';
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
      }
    `);
    await sleep(800);
    console.log('Capturing Screenshot 2: Add Text tool workspace...');
    await takeScreenshot('m3-02-add-text');

    // Return to tools
    await evaluate(`
      const backBtn = document.querySelector('.btn-back-to-tools');
      if (backBtn) backBtn.click();
    `);
    await sleep(800);

    // 4. Tool 2: Add Image
    console.log('Step 4: Opening Add Image tool...');
    await evaluate(`
      const rows = Array.from(document.querySelectorAll('.tool-subpanel-row'));
      const imgRow = rows.find(r => r.innerText.includes('Add image'));
      if (imgRow) imgRow.click();
    `);
    await sleep(1200);

    // Inject image into file upload input
    await evaluate(`
      const offscreen = document.createElement('canvas');
      offscreen.width = 160;
      offscreen.height = 160;
      const ctx = offscreen.getContext('2d');
      ctx.fillStyle = '#007AFF';
      ctx.beginPath();
      ctx.arc(80, 80, 70, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 18px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('VERIFIED', 80, 80);

      offscreen.toBlob((blob) => {
        const file = new File([blob], 'verified-seal.png', { type: 'image/png' });
        const dt = new DataTransfer();
        dt.items.add(file);
        const input = document.querySelector('#image-file-upload-input');
        if (input) {
          input.files = dt.files;
          input.dispatchEvent(new Event('change', { bubbles: true }));
        }
      }, 'image/png');
    `);
    await sleep(1200);
    console.log('Capturing Screenshot 3: Add Image tool workspace...');
    await takeScreenshot('m3-03-add-image');

    // Return to tools
    await evaluate(`
      const backBtn = document.querySelector('.btn-back-to-tools');
      if (backBtn) backBtn.click();
    `);
    await sleep(800);

    // 5. Tool 3: Highlight
    console.log('Step 5: Opening Highlight tool...');
    await evaluate(`
      const rows = Array.from(document.querySelectorAll('.tool-subpanel-row'));
      const hlRow = rows.find(r => r.innerText.includes('Highlight'));
      if (hlRow) hlRow.click();
    `);
    await sleep(1200);

    // Drag to create highlight rectangle on active page
    console.log('Creating sample highlight box on canvas via native drag...');
    const box5 = await getPageBox();
    if (box5) {
      await nativeDrag(box5.x + 40, box5.y + 250, box5.x + 460, box5.y + 285);
    }
    await sleep(800);
    console.log('Capturing Screenshot 4: Highlight tool workspace...');
    await takeScreenshot('m3-04-highlight');

    // Return to tools
    await evaluate(`
      const backBtn = document.querySelector('.btn-back-to-tools');
      if (backBtn) backBtn.click();
    `);
    await sleep(800);

    // 6. Tool 4: Draw
    console.log('Step 6: Opening Draw tool...');
    await evaluate(`
      const rows = Array.from(document.querySelectorAll('.tool-subpanel-row'));
      const drawRow = rows.find(r => r.innerText.includes('Draw'));
      if (drawRow) drawRow.click();
    `);
    await sleep(1200);

    // Draw smooth strokes on canvas
    console.log('Drawing vector pen strokes on canvas via native drag...');
    const box6 = await getPageBox();
    if (box6) {
      await nativeDrag(box6.x + 50, box6.y + 340, box6.x + 360, box6.y + 345);
    }
    await sleep(800);
    console.log('Capturing Screenshot 5: Draw tool workspace...');
    await takeScreenshot('m3-05-draw');

    // Return to tools
    await evaluate(`
      const backBtn = document.querySelector('.btn-back-to-tools');
      if (backBtn) backBtn.click();
    `);
    await sleep(800);

    // 7. Tool 5: Shapes
    console.log('Step 7: Opening Shapes tool...');
    await evaluate(`
      const rows = Array.from(document.querySelectorAll('.tool-subpanel-row'));
      const shapesRow = rows.find(r => r.innerText.includes('Shapes'));
      if (shapesRow) shapesRow.click();
    `);
    await sleep(1200);

    // Drag shape on canvas
    const box7 = await getPageBox();
    if (box7) {
      await nativeDrag(box7.x + 50, box7.y + 390, box7.x + 280, box7.y + 490);
    }
    await sleep(800);
    console.log('Capturing Screenshot 6: Shapes tool workspace...');
    await takeScreenshot('m3-06-shapes');

    // Return to tools
    await evaluate(`
      const backBtn = document.querySelector('.btn-back-to-tools');
      if (backBtn) backBtn.click();
    `);
    await sleep(800);

    // 8. Tool 6: Whiteout
    console.log('Step 8: Opening Whiteout tool...');
    await evaluate(`
      const rows = Array.from(document.querySelectorAll('.tool-subpanel-row'));
      const whiteoutRow = rows.find(r => r.innerText.includes('Whiteout'));
      if (whiteoutRow) whiteoutRow.click();
    `);
    await sleep(1200);

    // Create whiteout box
    const box8 = await getPageBox();
    if (box8) {
      await nativeDrag(box8.x + 40, box8.y + 510, box8.x + 380, box8.y + 550);
    }
    await sleep(800);
    console.log('Capturing Screenshot 7: Whiteout tool workspace...');
    await takeScreenshot('m3-07-whiteout');

    // Return to tools
    await evaluate(`
      const backBtn = document.querySelector('.btn-back-to-tools');
      if (backBtn) backBtn.click();
    `);
    await sleep(800);

    // 9. Tool 7: Redact
    console.log('Step 9: Opening Redact tool...');
    await evaluate(`
      const rows = Array.from(document.querySelectorAll('.tool-subpanel-row'));
      const redactRow = rows.find(r => r.innerText.includes('Redact'));
      if (redactRow) redactRow.click();
    `);
    await sleep(1200);

    // Create redaction box on canvas
    const box9 = await getPageBox();
    if (box9) {
      await nativeDrag(box9.x + 40, box9.y + 570, box9.x + 360, box9.y + 615);
    }
    await sleep(800);

    // Open confirmation dialog
    await evaluate(`
      const applyBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Apply Redaction'));
      if (applyBtn) applyBtn.click();
    `);
    await sleep(800);
    console.log('Capturing Screenshot 8: Redact tool workspace with confirmation card...');
    await takeScreenshot('m3-08-redact');

    // Return to tools
    await evaluate(`
      const backBtn = document.querySelector('.btn-back-to-tools');
      if (backBtn) backBtn.click();
    `);
    await sleep(800);

    // 10. Tool 8: Sign
    console.log('Step 10: Opening Sign tool...');
    await evaluate(`
      const rows = Array.from(document.querySelectorAll('.tool-subpanel-row'));
      const signRow = rows.find(r => r.innerText.includes('Sign'));
      if (signRow) signRow.click();
    `);
    await sleep(1200);

    // Draw signature on signature pad
    await evaluate(`
      const sigCanvas = document.querySelector('.signature-canvas-pad');
      if (sigCanvas) {
        const r = sigCanvas.getBoundingClientRect();
        sigCanvas.dispatchEvent(new MouseEvent('mousedown', { clientX: r.left + 20, clientY: r.top + 50, button: 0, bubbles: true }));
        sigCanvas.dispatchEvent(new MouseEvent('mousemove', { clientX: r.left + 60, clientY: r.top + 30, button: 0, bubbles: true }));
        sigCanvas.dispatchEvent(new MouseEvent('mousemove', { clientX: r.left + 120, clientY: r.top + 65, button: 0, bubbles: true }));
        sigCanvas.dispatchEvent(new MouseEvent('mousemove', { clientX: r.left + 190, clientY: r.top + 35, button: 0, bubbles: true }));
        sigCanvas.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
      }
    `);
    await sleep(800);
    console.log('Capturing Screenshot 9: Sign tool workspace...');
    await takeScreenshot('m3-09-sign');

    // Return to tools
    await evaluate(`
      const backBtn = document.querySelector('.btn-back-to-tools');
      if (backBtn) backBtn.click();
    `);
    await sleep(800);

    // 11. Tool 9: Fill Forms
    console.log('Step 11: Opening Fill Forms tool...');
    await evaluate(`
      const rows = Array.from(document.querySelectorAll('.tool-subpanel-row'));
      const formsRow = rows.find(r => r.innerText.includes('Fill forms') || r.innerText.includes('forms'));
      if (formsRow) formsRow.click();
    `);
    await sleep(1500);
    console.log('Capturing Screenshot 10: Fill Forms tool workspace...');
    await takeScreenshot('m3-10-fill-forms');

    console.log('ALL 10 SCREENSHOTS CAPTURED WITH FULL REFINEMENTS!');

    ws.close();
    edgeProc.kill();
    server.close();
    process.exit(0);
  } catch (err) {
    console.error('Error during capture:', err);
    edgeProc.kill();
    server.close();
    process.exit(1);
  }
});
