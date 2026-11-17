// Emberglade local server. No dependencies; needs Node 18+.
//   node server.js          -> http://localhost:8787
// Serves the site, and forwards /proxy/* to the API base URL set in Settings,
// for proxies that refuse requests made directly from a browser.
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = Number(process.env.PORT) || 8787;
const ROOT = __dirname;
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.wasm': 'application/wasm', '.ico': 'image/x-icon' };

async function forward(req, res) {
  let base;
  try { base = new URL(String(req.headers['x-target-base'] || '')); } catch { base = null; }
  if (!base || !/^https?:$/.test(base.protocol)) { res.writeHead(400, { 'Content-Type': 'application/json' }); return res.end(JSON.stringify({ error: { message: 'Missing or invalid API base URL.' } })); }
  const target = base.href.replace(/\/+$/, '') + req.url.slice('/proxy'.length);
  const chunks = []; for await (const c of req) chunks.push(c);
  const headers = { 'Content-Type': req.headers['content-type'] || 'application/json' };
  if (req.headers.authorization) headers.Authorization = req.headers.authorization;
  try {
    const up = await fetch(target, { method: req.method, headers, body: ['GET', 'HEAD'].includes(req.method) ? undefined : Buffer.concat(chunks) });
    res.writeHead(up.status, { 'Content-Type': up.headers.get('content-type') || 'application/json', 'Cache-Control': 'no-cache' });
    if (!up.body) return res.end();
    const reader = up.body.getReader();
    res.on('close', () => reader.cancel().catch(() => {}));
    for (;;) { const { done, value } = await reader.read(); if (done) break; res.write(value); }
    res.end();
  } catch (e) {
    if (!res.headersSent) res.writeHead(502, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: { message: 'Local server could not reach ' + base.host + ': ' + e.message } }));
  }
}

http.createServer((req, res) => {
  if (req.url.startsWith('/proxy/')) return forward(req, res);
  const rel = decodeURIComponent(req.url.split('?')[0]);
  const file = path.join(ROOT, rel === '/' ? 'index.html' : rel);
  if (!file.startsWith(ROOT + path.sep)) { res.writeHead(403); return res.end(); }
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404); return res.end('Not found'); }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' });
    res.end(data);
  });
}).listen(PORT, '127.0.0.1', () => console.log('Emberglade is burning at http://localhost:' + PORT));
