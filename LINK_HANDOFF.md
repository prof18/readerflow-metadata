# ReaderFlow HTTPS article links

The planned handoff URL remains:

```text
https://www.readerflow.app/article/?url=<percent-encoded-original-article-url>
```

Keep the trailing slash: `docs/article/index.html` is a real static Pages route, so generated links load directly without a slash redirect. `docs/index.html` remains the marketing page; domain routing is configured in Cloudflare. There is no article fetch, reader, iframe, redirect to the publisher, analytics, or backend. The browser constructs a validated `readerflow://article?url=…` link and launches it only when the user clicks Open ReaderFlow.

## Hosting: Cloudflare Pages and DNS

Cloudflare Pages project `readerflow-site` serves this site from `prof18/readerflow-metadata`,
branch `main`. GitHub hosts source code only; GitHub Pages is disabled.
Production deployments are automatic. Output directory: `docs`; Node version: 22.

Build command:

```sh
node --test tools/links/tests/parser.test.mjs && node tools/links/check-deployment.mjs
```

The project hostname is `readerflow-site.pages.dev`; its custom domain is `www.readerflow.app`.
The `_headers` file serves both association files as `application/json` and applies the handoff
security headers only to `/article/*`. The marketing page stays unchanged.

### DNS and redirect

Registration remains at EnCirca. DNS is managed in the same Cloudflare account as Pages,
`50096d55df0f8a6fcec0e8669ea517e5`. Assigned nameservers:

- `cass.ns.cloudflare.com`
- `ishaan.ns.cloudflare.com`

| Type | Name | Target | Proxy |
| --- | --- | --- | --- |
| CNAME | www | readerflow-site.pages.dev | Proxied |
| A | @ | 192.0.2.1 | Proxied |

The apex address is a redirect-only placeholder, not a website origin. The active Single Redirect
`Redirect apex to www` matches `(http.host eq "readerflow.app")`, returns 301 to
`concat("https://www.readerflow.app", http.request.uri.path)`, and preserves the query string.
This handles HTTP and HTTPS. Do not reverse the redirect: the apps associate with `www`.
Existing Google verification and SPF TXT records are retained. No MX record existed at migration.

The zone activated on 2026-09-08. HTTPS, the apex redirect, and both association endpoints were
verified on the new route. Cached delegation can temporarily use the old provider.

### Verification

Verify the homepage and `/article/` on the custom domain, both association files returning 200
without redirects with JSON MIME types, and the apex redirect preserving path and query.
Keep association endpoints free of authentication and bot challenges. The page never fetches
or renders articles. Query strings contain the original URL; encoding does not make it secret.

## Android signing fingerprint — required

`docs/.well-known/assetlinks.json` now associates `com.prof18.readerflow` with the supplied Android signing certificate:

```text
4C:A4:18:8B:F3:17:B7:2E:DF:15:33:ED:87:BC:AA:B2:91:48:C4:59:5B:7A:56:C8:90:5D:2E:A2:DD:6B:F9:98
```

For future certificate updates, in Google Play Console, open ReaderFlow's **App integrity / App signing** information and copy the **app signing key certificate SHA-256**. Do not use the upload key certificate. From this repository root:

```sh
node tools/links/scripts/write-assetlinks.mjs 'AA:BB:...actual full SHA-256...'
node tools/links/check-deployment.mjs
```

The script accepts 64 hexadecimal digits or 32 colon-separated bytes and emits the required colon-separated uppercase format. Pass more than one certificate when Play key rotation requires supporting different installed versions. Review and commit the generated JSON with the other website changes. The checker intentionally fails before the certificate is configured; run it before publishing. The Cloudflare Pages build command above runs this checker before publishing.

## Apple signing — required

The AASA file associates `/article/` with `Q7CUB3RNAK.com.prof18.readerflow`, the production app ID expected from ReaderFlow's project. Before release, inspect the signed app identifier to confirm the prefix and bundle ID.

1. Enable **Associated Domains** for the production ReaderFlow identifier in Apple Developer Certificates, Identifiers & Profiles.
2. Regenerate/download the affected iOS and macOS provisioning profiles. The app entitlement is `applinks:www.readerflow.app`.
3. For local signed Debug builds, enable the capability and refresh the profile for `com.prof18.readerflow.dev` too. The existing local macOS Debug profile lacked this capability during implementation.
4. Build and distribute updated iOS/macOS apps. The CLI and Share Extension do not receive the Associated Domains entitlement.

The public AASA and Android associations intentionally include production IDs only. Debug builds can test parsing and navigation directly, but will not verify against these production files. Use production-signed TestFlight/Play builds for end-to-end checks. If both Debug and Release are installed, custom-scheme fallback ownership can be ambiguous; use a production-only device for release verification.

## Local checks

Node 22+; no package installation is required:

```sh
node --test tools/links/tests/parser.test.mjs
node tools/links/check-deployment.mjs
node tools/links/dev-server.mjs
```

Preview `http://localhost:8788/article/?url=https%3A%2F%2Fexample.com`. The development server emulates the intended Cloudflare Pages JSON/header behavior. It prints only its start URL, not incoming request query strings.

Check desktop/mobile rendering, the exact Open ReaderFlow URI, clipboard success and denied-clipboard recovery, invalid links, and no article or third-party network requests. A JavaScript-disabled browser gets instructions rather than an automatic launch. The page cannot reliably detect app installation or carry a link through installation: return to the Telegram message and tap again afterward.

## Live validation and rollout

After deploying to Cloudflare Pages and connecting the custom domain:

```sh
curl --fail --silent --show-error -D - https://www.readerflow.app/.well-known/apple-app-site-association
curl --fail --silent --show-error -D - https://www.readerflow.app/.well-known/assetlinks.json
curl --fail --silent --show-error -I 'https://www.readerflow.app/article/?url=https%3A%2F%2Fexample.com'
```

All three should return 200 directly. Association files must be JSON with `Content-Type: application/json`. Check Apple's CDN copy at `https://app-site-association.cdn-apple.com/a/v1/www.readerflow.app`; allow cache propagation before diagnosing an app problem. Test a tap from Notes rather than entering a URL in Safari's address bar.

For a Play-installed Android build:

```sh
adb shell pm verify-app-links --re-verify com.prof18.readerflow
adb shell pm get-app-links com.prof18.readerflow
adb shell am start -W -a android.intent.action.VIEW -c android.intent.category.BROWSABLE -d 'https://www.readerflow.app/article/?url=https%3A%2F%2Fexample.com'
```

Wait for verification to complete before inspecting state. Do not supply an explicit package to the last command: doing so tests routing code but bypasses the real resolver choice. Verify `www.readerflow.app` is verified and supported-link handling is enabled.

Test Telegram iOS, Android, Desktop and native macOS clients: installed/not installed, cold/warm launch, user browser preference, cached/offline and unsaved articles. An HTTPS button is tappable; Telegram's browser may still keep it in the browser. Then test the explicit Open ReaderFlow button and external-browser instructions. Keep custom-scheme intake for the fallback page’s Open ReaderFlow button.

Release the native apps and publish the website before using this command in Hermes:

```sh
readerflow random --json --deep-link
```

Use the JSON `deepLink` value for a normal Telegram URL button or text link. Disable previews. `--deep-link` now emits HTTPS directly; the previous CLI behavior was never deployed, so no separate `--share-link` flag or `shareLink` field is needed. The app still accepts the custom scheme for the fallback button. This repository does not modify Hermes configuration or send Telegram messages.

## References

- [GitHub Pages publishing](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)
- [Cloudflare Pages custom headers](https://developers.cloudflare.com/pages/configuration/headers/)
- [Cloudflare Pages custom domains and DNS](https://developers.cloudflare.com/pages/configuration/custom-domains/)
- [Apple associated domains](https://developer.apple.com/documentation/xcode/supporting-associated-domains)
- [Apple Universal Link diagnostics](https://developer.apple.com/documentation/technotes/tn3155-debugging-universal-links)
- [Android website associations](https://developer.android.com/training/app-links/configure-assetlinks)
- [Android verification](https://developer.android.com/training/app-links/verify-applinks)
