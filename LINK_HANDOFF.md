# ReaderFlow HTTPS article links

The planned handoff URL remains:

```text
https://www.readerflow.app/article/?url=<percent-encoded-original-article-url>
```

Keep the trailing slash: `docs/article/index.html` is a real static Pages route, so generated links load directly without a slash redirect. `docs/index.html` and `docs/CNAME` are unchanged; the migration is configured in the hosting dashboard and DNS. There is no article fetch, reader, iframe, redirect to the publisher, analytics, or backend. The browser constructs a validated `readerflow://article?url=…` link and launches it only when the user clicks Open ReaderFlow.

## Hosting migration required for this setup: GitHub Pages to Cloudflare Pages

**Current live hosting: GitHub Pages. Cloudflare Pages project created: `readerflow-site`. No deployment or DNS cutover has happened yet.**

The agent has already connected `prof18/readerflow-metadata` (branch `main`), configured the
`docs` output directory and the build command below, set Node 22, and registered
`www.readerflow.app` as the custom domain. It is pending DNS validation. Automatic production
and preview deployments are disabled until the local changes are pushed. The supplied Android
signing fingerprint is configured locally. Do not create another project.

Assigned Pages hostname: `readerflow-site.pages.dev`. Authoritative DNS nameservers are
`standard3.encirca.net` and `standard4.encirca.net`; manage the www record at that DNS provider.
The Cloudflare account exposed to the agent does not contain a readerflow.app DNS zone.

GitHub Pages cannot configure the HTTP Content-Type header for Apple's extensionless
`apple-app-site-association` file. For reliable association hosting, this setup uses Cloudflare
Pages, which applies the included `docs/_headers` file. There is no existing Cloudflare proxy
for the user to configure. Previous instructions claiming otherwise were incorrect.

Keep the same GitHub repository and the same `docs/` website files. GitHub continues to host
source code; Cloudflare Pages becomes the website host. No article reader or backend is added.
The native app URLs and `www.readerflow.app` address remain unchanged.

### 1. Deploy the already-created Cloudflare Pages project

The supplied Android signing fingerprint is already configured.

1. Commit and push the website changes to `main`. They are currently local only.
2. Open the existing `readerflow-site` Pages project. Its configuration is already:
   - Git repository: `prof18/readerflow-metadata`, production branch `main`.
   - Root directory: repository root; output directory: `docs`.
   - Build command: `node --test tools/links/tests/parser.test.mjs && node tools/links/check-deployment.mjs`.
   - Node version: 22; no framework or Functions.
3. Enable production deployments and trigger a deployment. The agent can perform this through
   the Cloudflare API once the files and fingerprint are ready.
4. Test `https://readerflow-site.pages.dev` and both association endpoints before changing DNS.

The deployment checker intentionally fails until a valid production Android signing fingerprint
is configured. `_headers` is part of the published directory and sets `Content-Type: application/json`
on the two association files. It scopes security headers to `/article/*`, leaving the marketing
page's scripts and fonts alone. No separate response-header dashboard rule is needed.

### 2. Connect www.readerflow.app and change its DNS

The Pages project already has **www.readerflow.app** registered under Custom domains. After a successful deployment, edit the record at your current DNS provider:

| Type | Name | Target |
| --- | --- | --- |
| CNAME | www | `readerflow-site.pages.dev` |

The exact target is `readerflow-site.pages.dev`. Replace the current `www` records rather than
adding conflicting records. The current DNS answer includes A and AAAA records; a CNAME must
not coexist with A/AAAA records at the same www name. Keep a copy of the old record for
rollback. Wait for the custom domain and HTTPS certificate to become active, then verify the site
and association endpoints. Do not redirect `www` to the apex; the apps associate with `www`.

**You can keep your current DNS provider and nameservers when using the `www` subdomain.**
Adding the bare `readerflow.app` apex to Cloudflare Pages is a separate option that requires the
zone's nameservers on Cloudflare. Inspect the existing apex-to-www behavior during migration:
if GitHub Pages currently supplies that redirect, leave it active until its replacement is tested.
Do not disable GitHub Pages until both the new www site and any existing apex redirect work.

If you also want the apex site hosted on Cloudflare Pages, migrate the DNS zone, preserve its
existing records (including email), then add the apex custom domain. That is not necessary just
to host the new links at www.readerflow.app.

### 3. Verify the live response and retire the old host

Keep the association endpoints publicly reachable without redirects, authentication or bot
challenges. Verify 200 responses, JSON bodies and `Content-Type: application/json` on the actual
custom domain. Only then retire the old GitHub Pages deployment when it is no longer needed for
an apex redirect or rollback. Future website updates publish through the new Pages project.

The page has no analytics or article-fetching requests. Avoid enabling request logging or analytics
that captures article query strings. The original URL remains visible in the shared link and can
reach hosting infrastructure; percent encoding does not make it secret.

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
