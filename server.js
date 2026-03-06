const http = require('http');
const fs   = require('fs');
const path = require('path');

const DEFAULT_PORT = parseInt(process.env.PORT, 10) || 8080;
const MAX_ATTEMPTS = 10;

// Optional first argument selects the root directory to serve.
// e.g.  node server.js dist   →  serves ./dist/
const SERVE_DIR = process.argv[2]
  ? path.resolve(process.argv[2])
  : __dirname;

const MIME = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.xml': 'application/xml',
  '.ico': 'image/x-icon',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain',
};

function serveFile(res, filePath) {
  fs.readFile(filePath, (err, data) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found');
      } else {
        res.writeHead(500);
        res.end('Server Error');
      }
      return;
    }
    const ext = path.extname(filePath);
    const contentType = MIME[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
}

const server = http.createServer((req, res) => {
  let urlPath = req.url === '/' ? '/index.html' : req.url.split('?')[0];
  let filePath = path.join(SERVE_DIR, urlPath);

  fs.stat(filePath, (err, stat) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found');
      } else {
        res.writeHead(500);
        res.end('Server Error');
      }
      return;
    }
    if (stat.isDirectory()) {
      filePath = path.join(filePath, 'index.html');
      serveFile(res, filePath);
    } else {
      serveFile(res, filePath);
    }
  });
});

let attemptPort = DEFAULT_PORT;

function tryListen() {
  if (attemptPort > DEFAULT_PORT + MAX_ATTEMPTS) {
    console.error('No available port found. Free port', DEFAULT_PORT, 'or set PORT= another number.');
    process.exit(1);
  }
  server.listen(attemptPort, () => {
    console.log(`ManyUtils running at http://localhost:${attemptPort}`);
    console.log(`Serving: ${SERVE_DIR}`);
  });
}

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    attemptPort += 1;
    tryListen();
  } else {
    throw err;
  }
});

tryListen();
