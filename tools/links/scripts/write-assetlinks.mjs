import { writeFile } from 'node:fs/promises';

const inputs = process.argv.slice(2);
const fingerprintPattern = /^(?:[0-9A-Fa-f]{64}|(?:[0-9A-Fa-f]{2}:){31}[0-9A-Fa-f]{2})$/;
if (!inputs.length || inputs.some(value => !fingerprintPattern.test(value))) {
  console.error('Usage: node tools/links/scripts/write-assetlinks.mjs <Play app signing SHA256> [...fingerprints]');
  process.exit(1);
}
const fingerprints = [...new Set(inputs.map(value =>
  value.replaceAll(':', '').toUpperCase().match(/../g).join(':')
))];
const association = [{
  relation: ['delegate_permission/common.handle_all_urls'],
  target: {
    namespace: 'android_app',
    package_name: 'com.prof18.readerflow',
    sha256_cert_fingerprints: fingerprints
  }
}];
const output = new URL('../../../docs/.well-known/assetlinks.json', import.meta.url);
await writeFile(output, JSON.stringify(association, null, 2) + '\n');
console.log(`Wrote ${fingerprints.length} production signing fingerprint(s).`);
