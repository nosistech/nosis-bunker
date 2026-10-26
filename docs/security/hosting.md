# Hosting

The page works from a file on a disk. The official website is **https://bunker.nosistech.com**. This document tells how to publish it.

## What the website is

The folder `site/` holds the complete website. `tools/site.js` makes it from the build. The folder is in the repository, so the host only copies files. The host runs no build, no npm and no Node.js (ADR-025).

| File | Purpose |
|---|---|
| `index.html` | The page. It is byte for byte the same as `dist/nosis-bunker.html`. |
| `nosis-bunker.html` | The same file, sent as a download, for offline use. |
| `SHA256SUMS.txt` | The SHA-256 hash of the page. |
| `_headers` | HTTP security headers. Cloudflare Pages and Netlify read this file. |
| `.well-known/security.txt` | How to report a security problem (RFC 9116). |
| `robots.txt` | Lets search engines find the page, and points to the sitemap. |
| `llms.txt`, `networks.json`, `sitemap.xml` | Files for AI agents and search engines. See [docs/10-agents.md](../10-agents.md). |

## Why headers are necessary

The page has a Content Security Policy in a `<meta>` tag. Some protections do not work in a meta tag:

- `frame-ancestors` (stops other sites from putting the page in a frame).
- `X-Content-Type-Options`, `Strict-Transport-Security` and `Permissions-Policy`.

The web server must send these as HTTP headers. `site/_headers` also repeats the full policy with the script and style hashes. The browser applies both policies.

## Option A (recommended): Cloudflare Pages

Cost: free. Time: about 15 minutes.

### Step 1. Make the project

1. Sign in to <https://dash.cloudflare.com>.
2. Select **Workers & Pages**, then **Create**, then the **Pages** tab, then **Connect to Git**.
3. Connect GitHub. Give access to the `nosistech/nosis-bunker` repository only.
4. Select the repository. Set these values:

   | Setting | Value |
   |---|---|
   | Production branch | `main` |
   | Framework preset | None |
   | Build command | (empty) |
   | Build output directory | `site` |

5. Select **Save and Deploy**.

If you do not want to connect GitHub, use **Upload assets** instead and upload the `site` folder. Upload it again after each release.

### Step 2. Add the domain

1. Open the project. Select **Custom domains**, then **Set up a custom domain**.
2. Type `bunker.nosistech.com`.
3. If the DNS of nosistech.com is on Cloudflare, Cloudflare adds the record. Go to step 3.
4. If the DNS is at another provider, add this record there:

   | Type | Name | Target | TTL |
   |---|---|---|---|
   | CNAME | `bunker` | `<project-name>.pages.dev` | Auto or 3600 |

5. Wait until the domain shows **Active**. Cloudflare makes the TLS certificate.

### Step 3. Turn off features that change the page

Cloudflare can change HTML on the way to the user. A changed script does not match its CSP hash, and the page stops working. `Cache-Control: no-transform` asks Cloudflare not to change the page. Also make sure that these features are off for the zone:

- Rocket Loader
- Email Address Obfuscation
- Web Analytics automatic setup (it adds a script)
- Zaraz

### Cache rule for the zone

A zone can have cache rules for other sites, for example a rule that caches HTML pages at the edge. Such a rule also matches `bunker.nosistech.com`, so a new release does not show until the cached copy expires (P-32). The fix is one more cache rule, placed last so that it wins:

| Setting | Value |
|---|---|
| Name | Bypass cache for Bunker (bunker.nosistech.com) |
| Expression | `(http.host eq "bunker.nosistech.com")` |
| Cache eligibility | Bypass cache |
| Order | Last |

With `Cache-Control: no-cache` from `site/_headers`, every visit gets the newest page. The page is about 300 KB, so this costs little. Added on 2026-10-25.

### Headers that Cloudflare adds

- `Access-Control-Allow-Origin: *`. Cloudflare Pages adds it. `site/_headers` removes it with a `! Access-Control-Allow-Origin` line.
- `Report-To` and `NEL` (Network Error Logging). Cloudflare adds them at its edge, after `_headers`, so a `!` line cannot remove them. They ask the browser to report failed connections (never successful visits, `success_fraction` is 0) to Cloudflare. Cloudflare already serves the page, so it learns nothing new about the user. To remove them on `bunker.nosistech.com`, add a Response Header Transform Rule in the nosistech.com zone that removes `NEL` and `Report-To`. The page itself still sends nothing.
- Cloudflare Pages sends `/nosis-bunker.html` to `/nosis-bunker` with a 308 redirect. The download rule covers both paths.

### Step 4. Examine the result

1. Open <https://bunker.nosistech.com>. The page must work.
2. Open the browser developer tools. The Console must show no CSP errors.
3. On the Network tab, select the page. The response headers must match `site/_headers`.
4. Download `https://bunker.nosistech.com/nosis-bunker.html`. Its SHA-256 hash must match `site/SHA256SUMS.txt`.
5. Test the headers at <https://securityheaders.com>. The expected grade is A or A+.

Status on 2026-10-25: live on Cloudflare Pages with an empty build command. The served file matched the published hash, and the headers matched `site/_headers`.

## Option B: your own server (VPS) with Caddy

Use this option to host Bunker on your own server.

1. Install Caddy from <https://caddyserver.com/docs/install>.
2. Copy the folder `site/` to `/srv/nosis-bunker` on the server.
3. Copy `deploy/Caddyfile` to `/etc/caddy/Caddyfile`, or add its block to your file.
4. Add a DNS **A** record: name `bunker`, value the IPv4 address of the server. Add an **AAAA** record if the server has IPv6.
5. Run `sudo systemctl reload caddy`. Caddy gets the TLS certificate.
6. Do step 4 of option A.

The Caddyfile sets the same headers as `site/_headers`, except the hash policy. The meta tag in the page carries the hash policy, so the Caddyfile does not change between releases.

## Release steps

1. Run `npm run check` on a patched Node.js (see [supply-chain.md](supply-chain.md)).
2. Commit `dist/` and `site/` with the source change.
3. Push to `main`. CI must pass.
4. Option A deploys by itself. For option B, copy `site/` to the server again.
5. Publish the new SHA-256 hash with the release notes.

## One official domain

Put the domain and the SHA-256 hash in each announcement. Tell users to compare the hash. This makes fake copies easier to find. Scammers copy security tools and add a "seed phrase check". The real page never asks for a seed phrase.
