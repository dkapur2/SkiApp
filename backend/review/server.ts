import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

export const REVIEW_HOST = '127.0.0.1';
export const REVIEW_PORT = 4317;
const backend = resolve(__dirname, '..');
const assets = new Map<string, { path: string; type: string }>([
  ['/', { path: resolve(backend, 'review/index.html'), type: 'text/html' }],
  ['/style.css', { path: resolve(backend, 'review/style.css'), type: 'text/css' }],
  ['/icon.svg', { path: resolve(backend, 'review/icon.svg'), type: 'image/svg+xml' }],
  ['/validation-protocol.md', { path: resolve(backend, '../docs/validation/protocol-0.1.0.md'), type: 'text/plain' }],
  ['/observation-template.json', { path: resolve(backend, '../docs/validation/observation-template-0.1.0.json'), type: 'application/json' }],
  ['/observation.schema.json', { path: resolve(backend, '../docs/validation/observation-0.1.0.schema.json'), type: 'application/json' }],
]);
for (const module of ['review/src/main', 'review/src/report', 'review/src/render', 'review/src/examples', 'src/analysis/evaluateFreezeThaw', 'src/analysis/freezeThaw', 'src/services/openMeteoHourly', 'src/data/resorts']) {
  const asset = { path: resolve(backend, `dist/review/${module}.js`), type: 'text/javascript' };
  assets.set(`/${module}`, asset); assets.set(`/${module}.js`, asset);
}

/** Dedicated opt-in loopback server. No upload, file-listing, proxy or weather endpoint. */
export function createReviewServer() {
  return createServer(async (request, response) => {
    response.setHeader('Cache-Control', 'no-store');
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.setHeader('Referrer-Policy', 'no-referrer');
    response.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
    response.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    response.setHeader('Content-Security-Policy', "default-src 'none'; script-src 'self'; style-src 'self'; connect-src 'none'; img-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'; object-src 'none'");
    const authority = `${REVIEW_HOST}:${request.socket.localPort}`;
    const deny = (status: number, message: string): void => { response.writeHead(status, { 'Content-Type': 'text/plain; charset=utf-8' }); response.end(message); };
    if (request.headers.host !== authority || (request.headers.origin && request.headers.origin !== `http://${authority}`) || request.headers['sec-fetch-site'] === 'cross-site') {
      deny(403, 'Use the local 127.0.0.1 review URL. Cross-origin access is disabled.'); return;
    }
    if (request.method !== 'GET' && request.method !== 'HEAD') { response.setHeader('Allow', 'GET, HEAD'); deny(405, 'This viewer accepts no uploads or mutations.'); return; }
    const asset = assets.get(request.url ?? '');
    if (!asset) { deny(404, 'Not a viewer asset. Local files are never served.'); return; }
    try {
      const bytes = await readFile(asset.path);
      response.writeHead(200, { 'Content-Type': `${asset.type}; charset=utf-8` });
      response.end(request.method === 'HEAD' ? undefined : bytes);
    } catch { deny(503, 'Viewer asset unavailable. Run npm run build:review from backend and check the validation documents.'); }
  });
}

if (require.main === module) {
  const server = createReviewServer();
  server.on('error', () => { console.error('Cannot start the local review server on 127.0.0.1:4317. Check whether the port is already in use.'); process.exitCode = 1; });
  server.listen(REVIEW_PORT, REVIEW_HOST, () => console.log(`Local review viewer: http://${REVIEW_HOST}:${REVIEW_PORT} (Ctrl+C to stop; no weather fetching or uploads)`));
}
