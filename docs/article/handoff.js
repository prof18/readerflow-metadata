import { parseLocation } from './parser.js';

const result = parseLocation(window.location);
const openButton = document.querySelector('#open-button');
const copyWrap = document.querySelector('#copy-wrap');
const status = document.querySelector('#status');
const installButton = document.querySelector('#install-button');

if (/Android/i.test(navigator.userAgent)) {
  installButton.href = 'https://play.google.com/store/apps/details?id=com.prof18.readerflow';
}

if (result.ok) {
  openButton.href = result.href;
  openButton.hidden = false;
  copyWrap.hidden = false;
  document.querySelector('#copy-button').addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(result.original);
      status.textContent = 'Article URL copied.';
    } catch {
      const field = document.querySelector('#manual-copy');
      field.value = result.original;
      field.hidden = false;
      field.focus();
      field.select();
      status.textContent = 'Select and copy the article URL below.';
    }
  });
} else {
  document.querySelector('#title').textContent = 'This article link is incomplete or invalid.';
  document.querySelector('#intro').textContent = 'Ask the sender for a new ReaderFlow link.';
  document.querySelector('#browser-help').hidden = true;
}
