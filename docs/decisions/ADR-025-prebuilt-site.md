# ADR-025. Publish a prebuilt website folder

Status: Accepted. Date: 2026-10-25.

## Context

The tool needs a public home: https://bunker.nosistech.com. Most static hosts can run a build command. A build on the host runs npm and Node.js on a computer that we do not control. In October 2026, Node.js fixed a remote code execution flaw (CVE-2026-111497), and npm had worm attacks.

## Options

| Option | For | Against |
|---|---|---|
| A. The host runs `npm run build` | Common; no build files in the repository | Node.js and npm run on the host; the Node.js version on the host is not under our control; the published file can differ from the tested file |
| B. CI builds and uploads to the host with a deploy token | Builds in a controlled place | A deploy token in CI; a third-party deploy action or a custom upload script |
| **C. Commit the built folder `site/`; the host only serves files** | No build and no secrets on the host; the published bytes are the tested bytes; CI proves that `site/` matches a fresh build | Built files in the repository |

## Decision

Option C. `tools/site.js` writes `site/`. CI fails if `site/` differs from a fresh build. The host settings have an empty build command and the output folder `site`.

## Consequences

- Any static host works: Cloudflare Pages, Netlify, GitHub Pages or a VPS with Caddy.
- The SHA-256 hash in `site/SHA256SUMS.txt` matches the file that users get.
- `site/_headers` repeats the CSP with its hashes as an HTTP header, and adds `frame-ancestors`, HSTS and the other headers. See [hosting.md](../security/hosting.md).
