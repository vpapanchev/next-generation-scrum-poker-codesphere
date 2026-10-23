import { createReadStream, existsSync, statSync } from 'fs';
import { createServer } from 'http';
import { extname, resolve, sep } from 'path';
import { attachWebSocketServer } from './socket';

const MIME_TYPES: Record<string, string> = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

const port = Number(process.env.PORT || 3000);
const staticDir = resolve(process.env.STATIC_DIR || 'frontend/dist');
const indexPath = resolve(staticDir, 'index.html');

const isFile = (path: string): boolean => {
  try {
    return existsSync(path) && statSync(path).isFile();
  } catch {
    return false;
  }
};

const serveFile = (path: string, statusCode: number) => {
  const stream = createReadStream(path);
  return { stream, statusCode };
};

export const startServer = () => {
  const server = createServer((request, response) => {
    const { pathname } = new URL(
      request.url || '/',
      `http://${request.headers.host || 'localhost'}`,
    );

    if (pathname === '/healthz') {
      response.writeHead(200, { 'content-type': 'text/plain' });
      response.end('ok');
      return;
    }

    // Resolve the requested path inside the build output and guard against
    // escaping it (path traversal).
    const requestedPath = resolve(staticDir, `.${decodeURIComponent(pathname)}`);
    const servedPath =
      requestedPath.startsWith(staticDir + sep) && isFile(requestedPath)
        ? requestedPath
        : indexPath;

    if (!isFile(servedPath)) {
      response.writeHead(503, { 'content-type': 'text/plain' });
      response.end(`Frontend build not found. Run "npm run build:frontend" first (${staticDir}).`);
      return;
    }

    const { stream, statusCode } = serveFile(servedPath, 200);
    response.writeHead(statusCode, {
      'content-type': MIME_TYPES[extname(servedPath)] || 'application/octet-stream',
      // Hashed assets can be cached, the SPA entry point must not be.
      'cache-control': servedPath === indexPath ? 'no-store' : 'public, max-age=3600',
    });
    stream.pipe(response);
  });

  attachWebSocketServer(server);

  server.listen(port, '0.0.0.0', () => {
    console.log(`Scrum poker listening on http://0.0.0.0:${port}`);
    console.log(`Serving frontend from ${staticDir}`);
  });

  return server;
};
