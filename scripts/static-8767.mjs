import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const mime = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.mjs': 'text/javascript',
  '.css': 'text/css',
  '.png': 'image/png',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.wasm': 'application/wasm',
  '.ico': 'image/x-icon',
};

http
  .createServer((req, res) => {
    let u = decodeURIComponent((req.url || '/').split('?')[0]);
    if (u === '/') u = '/index.html';
    const f = path.join(root, path.normalize(u).replace(/^(\.\.(\/|\\|$))+/, ''));
    if (!f.startsWith(root)) {
      res.writeHead(403);
      return res.end('forbidden');
    }
    fs.readFile(f, (e, d) => {
      if (e) {
        res.writeHead(404);
        return res.end('not found');
      }
      res.writeHead(200, {
        'Content-Type': mime[path.extname(f)] || 'application/octet-stream',
        'Cache-Control': 'no-cache',
      });
      res.end(d);
    });
  })
  .listen(8767, '127.0.0.1', () => console.log('up 8767', root));
