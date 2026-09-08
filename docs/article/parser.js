export const MAX_WRAPPER_LENGTH = 16_384;
export const MAX_ARTICLE_LENGTH = 8_192;

function invalid() {
  return { ok: false };
}

function unsafeCharacters(value) {
  return /[\\\u0000-\u001F\u007F-\u009F]/.test(value) || /%(?![0-9a-fA-F]{2})/.test(value);
}

export function parseArticleRequest(search) {
  if (typeof search !== 'string' || search.length > MAX_WRAPPER_LENGTH || unsafeCharacters(search)) {
    return invalid();
  }
  let values;
  try {
    values = search.replace(/^\?/, '').split('&').map(pair => {
      const separator = pair.indexOf('=');
      const key = separator < 0 ? pair : pair.slice(0, separator);
      const value = separator < 0 ? '' : pair.slice(separator + 1);
      return [key, value].map(part => decodeURIComponent(part.replaceAll('+', ' ')));
    }).filter(([key]) => key === 'url').map(([, value]) => value);
  } catch {
    return invalid();
  }
  if (values.length !== 1) return invalid();
  const original = values[0];
  if (!original || original.length > MAX_ARTICLE_LENGTH || unsafeCharacters(original)) return invalid();
  const authority = original.match(/^https?:\/\/([^/?#]+)/i)?.[1];
  if (!authority || /[@%\s]/.test(authority)) return invalid();

  let article;
  try {
    article = new URL(original);
  } catch {
    return invalid();
  }
  const hostname = article.hostname.toLowerCase().replace(/\.$/, '');
  const recursive = hostname === 'open.readerflow.app' ||
    (hostname === 'www.readerflow.app' && ['/article', '/article/'].includes(article.pathname));
  if (article.username || article.password || article.port || recursive) return invalid();
  return { ok: true, original, href: `readerflow://article?url=${encodeURIComponent(original)}` };
}

export function parseLocation(location) {
  const pathname = location?.pathname ?? '';
  const search = location?.search ?? '';
  const hash = location?.hash ?? '';
  const href = location?.href ?? `https://www.readerflow.app${pathname}${search}${hash}`;
  if (pathname !== '/article/' || hash || href.length > MAX_WRAPPER_LENGTH) return invalid();
  return parseArticleRequest(search);
}
