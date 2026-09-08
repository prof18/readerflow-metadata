import test from 'node:test';
import assert from 'node:assert/strict';
import { parseArticleRequest, parseLocation } from '../../../docs/article/parser.js';

const wrap = value => `?url=${encodeURIComponent(value)}`;
test('round trips Unicode, plus signs, fragments and encoded queries exactly', () => {
  const original = 'https://example.com/read/été?term=a+b&next=%E2%9C%93#part-2';
  const result = parseArticleRequest(wrap(original));
  assert.equal(result.ok, true); assert.equal(result.original, original); assert.equal(decodeURIComponent(result.href.split('=')[1]), original);
});
test('rejects duplicates, injection, invalid escapes and unsupported URLs', () => {
  for (const search of ['?url=https%3A%2F%2Fexample.com&url=https%3A%2F%2Fexample.com', '?url=https%3A%2F%2Fexample.com%5C%22%3E', '?url=%ZZ', '?url=https%3A%2F%2Fopen.readerflow.app%2Farticle', '?url=https%3A%2F%2Fuser%3Apass%40example.com', '?url=ftp%3A%2F%2Fexample.com', '?url=https%3A%2F%2Fexample.com%3A8443']) assert.equal(parseArticleRequest(search).ok, false, search);
});
test('allows extra parameters but rejects controls and oversized wrappers', () => {
  assert.equal(parseArticleRequest('?url=https%3A%2F%2Fexample.com&x=1').ok, true);
  assert.equal(parseArticleRequest('?url=https%3A%2F%2Fexample.com%00').ok, false);
  assert.equal(parseArticleRequest('?url=' + 'a'.repeat(16_384)).ok, false);
});
test('requires the exact article route and bounds the complete wrapper URL', () => {
  assert.equal(parseLocation({ pathname: '/article/', search: '?url=https%3A%2F%2Fexample.com', hash: '' }).ok, true);
  assert.equal(parseLocation({ pathname: '/other', search: '?url=https%3A%2F%2Fexample.com', hash: '' }).ok, false);
  assert.equal(parseLocation({ pathname: '/article/', search: '?url=https%3A%2F%2Fexample.com', hash: '#x' }).ok, false);
  assert.equal(parseLocation({ pathname: '/article/', search: '?' + 'a'.repeat(16_380), hash: '' }).ok, false);
});
test('rejects URL parser edge cases', () => {
  for (const value of ['https:example.com', 'https://@example.com', 'https://open.readerflow.app./article', 'https://example.com/%E0%A4%A']) {
    assert.equal(parseArticleRequest(wrap(value)).ok, false, value);
  }
  assert.equal(parseArticleRequest('?url=%E0%A4%A').ok, false);
});
test('decodes one layer and rejects encoded duplicate keys and recursive links', () => {
  assert.equal(parseArticleRequest('?url=https://example.com&%75rl=https://other.com').ok, false);
  assert.equal(parseArticleRequest('?url=https://example.com&%75rl=').ok, false);
  assert.equal(parseArticleRequest('?%75rl=https%3A%2F%2Fexample.com').original, 'https://example.com');
  assert.equal(parseArticleRequest(wrap('https://www.readerflow.app/article/?url=https://example.com')).ok, false);
  assert.equal(parseArticleRequest(wrap('https://www.readerflow.app/')).ok, true);
  assert.equal(parseArticleRequest(wrap('https://example.com:443/a')).ok, true);
  assert.equal(parseLocation({ pathname: '/article', search: wrap('https://example.com') }).ok, false);
  assert.equal(parseLocation({ pathname: '/article/', search: wrap('https://example.com'), href: 'x'.repeat(16_385) }).ok, false);
});
