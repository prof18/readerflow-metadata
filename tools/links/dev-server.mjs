import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';

const docs = new URL('../../docs/', import.meta.url);
const assets = new Map([
  ['/article/', ['article/index.html', 'text/html; charset=utf-8']],
  ['/article/handoff.js', ['article/handoff.js', 'text/javascript; charset=utf-8']],
  ['/article/parser.js', ['article/parser.js', 'text/javascript; charset=utf-8']],
  ['/article/styles.css', ['article/styles.css', 'text/css; charset=utf-8']],
  ['/.well-known/apple-app-site-association', ['.well-known/apple-app-site-association', 'application/json']],
  ['/.well-known/assetlinks.json', ['.well-known/assetlinks.json', 'application/json']]
]);
const headers = {
  'Content-Security-Policy': "default-src 'self'; connect-src 'none'; style-src 'self'; script-src 'self'; object-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",
  'Referrer-Policy': 'no-referrer',
  'X-Robots-Tag': 'noindex, nofollow, noarchive',
  'X-Content-Type-Options': 'nosniff'
};
createServer(async (request, response) => {
  const pathname = new URL(request.url, 'http://localhost:8788').pathname;
  if (pathname === '/article') {
    response.writeHead(301, { Location: request.url.replace('/article', '/article/') });
    response.end();
    return;
  }
  const asset = assets.get(pathname);
  if (!asset || !['GET', 'HEAD'].includes(request.method)) {
    response.writeHead(404, { ...headers, 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Not found');
    return;
  }
  try {
    const body = await readFile(new URL(asset[0], docs));
    response.writeHead(200, { ...headers, 'Content-Type': asset[1] });
    response.end(request.method === 'HEAD' ? undefined : body);
  } catch {
    response.writeHead(500);
    response.end('Missing local handoff asset');
  }
}).listen(8788, '127.0.0.1', () => console.log('ReaderFlow handoff: http://localhost:8788/article/'));
