import { spawn } from 'child_process';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.join(__dirname, 'dist');

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
  const ct = ext === '.html' ? 'text/html' : ext === '.js' ? 'application/javascript' : ext === '.css' ? 'text/css' : 'application/octet-stream';
  res.writeHead(200, { 'Content-Type': ct });
  res.end(fs.readFileSync(filePath));
});

server.listen(4174, '127.0.0.1', async () => {
  const edgeProc = spawn('C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', [
    '--headless=new',
    '--remote-debugging-port=9225',
    '--user-data-dir=c:\\VS Code\\Codes\\pdfstudio\\.tmp-diag',
    'http://127.0.0.1:4174'
  ]);

  await new Promise((r) => setTimeout(r, 2000));
  const tabs = await (await fetch('http://127.0.0.1:9225/json')).json();
  const pageTab = tabs.find((t) => t.url && t.url.includes('4174')) || tabs[0];
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

  ws.onopen = async () => {
    await new Promise((r) => setTimeout(r, 1000));

    const check = await send('Runtime.evaluate', {
      expression: `(() => {
        const darkBtn = document.querySelector('button[title="Dark theme"]');
        if (darkBtn) darkBtn.click();
        return {
          btnFound: !!darkBtn,
          themeAttr: document.documentElement.getAttribute('data-theme'),
          bodyBg: getComputedStyle(document.body).backgroundColor,
          appBg: getComputedStyle(document.querySelector('.home-showcase-wrapper')).backgroundColor
        };
      })()`,
      returnByValue: true
    });

    console.log('Diagnostic result:', check.result.result.value);

    // Take screenshot to test
    const shot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('C:\\Users\\ASUS\\.gemini\\antigravity\\brain\\2b797227-fae5-498b-b692-38c294b015a4\\2-home-dark.png', Buffer.from(shot.result.data, 'base64'));
    console.log('Dark screenshot saved!');

    edgeProc.kill('SIGKILL');
    server.close();
    process.exit(0);
  };
});

