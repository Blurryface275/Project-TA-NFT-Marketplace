import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { exec } from 'node:child_process';

const PORT = 5858;
const tldrPath = 'd:/STEVE/Project-TA-NFT-Marketplace/design/architecture/login-architecture.tldr';
const distDir = 'C:/Users/drons/AppData/Roaming/npm/node_modules/@kitschpatrol/tldraw-cli/dist/tldraw';

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
};

const server = http.createServer((req, res) => {
  const urlPath = req.url.split('?')[0];

  // Endpoint penyedia data tldr
  if (urlPath === '/tldr-data') {
    if (fs.existsSync(tldrPath)) {
      const data = fs.readFileSync(tldrPath, 'utf8');
      res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end(data);
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('File not found');
    }
    return;
  }

  // Melayani file statis tldraw editor
  let filePath = path.join(distDir, urlPath === '/' ? 'index.html' : urlPath);

  if (!fs.existsSync(filePath)) {
    filePath = path.join(distDir, 'index.html');
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(500);
      res.end('Server Error: ' + err.code);
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    }
  });
});

server.listen(PORT, 'localhost', () => {
  const localUrl = `http://localhost:${PORT}`;
  console.log(`🚀 tldraw Canvas Server aktif di: ${localUrl}`);
  console.log(`Memuat file: ${tldrPath}`);
  console.log(`Tekan Ctrl + C di terminal ini untuk berhenti.`);

  // Buka otomatis di browser
  const startCmd = process.platform === 'win32' ? 'start' : 'open';
  exec(`${startCmd} ${localUrl}`);
});
