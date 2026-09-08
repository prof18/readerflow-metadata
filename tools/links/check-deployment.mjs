import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';

const docs = new URL('../../docs/', import.meta.url);
for (const file of ['article/index.html', 'article/handoff.js', 'article/parser.js', 'article/styles.css', '_headers']) {
  await readFile(new URL(file, docs));
}
for (const name of ['newsreader-500', 'newsreader-600', 'public-sans-400', 'public-sans-600']) {
  await readFile(new URL(`article/fonts/${name}.ttf`, docs));
}
await readFile(new URL('icon-512.png', docs));
const headers = await readFile(new URL('_headers', docs), 'utf8');
for (const path of ['/.well-known/apple-app-site-association', '/.well-known/assetlinks.json']) {
  assert.ok(headers.includes(`${path}\n  Content-Type: application/json`), `Missing JSON header for ${path}`);
}
const aasa = JSON.parse(await readFile(new URL('.well-known/apple-app-site-association', docs), 'utf8'));
assert.deepEqual(aasa, {
  applinks: { details: [{ appID: 'Q7CUB3RNAK.com.prof18.readerflow', paths: ['/article/'] }] }
}, 'AASA must associate only the production ReaderFlow app with /article/');
const statements = JSON.parse(await readFile(new URL('.well-known/assetlinks.json', docs), 'utf8'));
assert.ok(Array.isArray(statements) && statements.length === 1,
  'Android association is not configured: run write-assetlinks.mjs with the Play app signing SHA-256');
const statement = statements[0];
assert.deepEqual(statement.relation, ['delegate_permission/common.handle_all_urls']);
assert.equal(statement.target.namespace, 'android_app');
assert.equal(statement.target.package_name, 'com.prof18.readerflow');
const fingerprints = statement.target.sha256_cert_fingerprints;
assert.ok(Array.isArray(fingerprints) && fingerprints.length > 0, 'Missing signing fingerprints');
assert.ok(fingerprints.every(value => typeof value === 'string' && /^(?:[0-9A-F]{2}:){31}[0-9A-F]{2}$/.test(value)),
  'Use colon-separated SHA-256 signing fingerprints');
console.log('Local association checks passed. Verify the published headers, Apple CDN and signed apps before rollout.');
