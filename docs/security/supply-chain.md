# Supply chain

This document tells how the project keeps outside code out of the page and out of the build. It maps to OWASP Top 10:2025 A03 (Software Supply Chain Failures) and A08 (Software or Data Integrity Failures).

## Two parts, two risks

| Part | Where it runs | Uses Node.js? | Risk |
|---|---|---|---|
| The page (`dist/nosis-bunker.html`, `site/index.html`) | In the browser of the user | No | A changed file. The CSP hashes and the published SHA-256 hash stop this. |
| The tools (`tools/`, `test/`) | On the computer of the developer and in CI | Yes | A bad Node.js version or a bad npm package on the build computer. |

The user never runs Node.js. A Node.js flaw can only reach the user if it changes the file that we publish. The controls below stop that.

## Events in October 2026

### Node.js security release (October 21, 2026)

Node.js fixed ten flaws. The most serious is CVE-2026-111497 ("Node2Shell"). It is an out-of-bounds write in the Brotli decoder. It can give remote code execution when Node.js decompresses Brotli data from an attacker. This can happen in three ways:

1. A web server that decompresses request bodies (for example Express 5 with body-parser 2).
2. `fetch()`, which decompresses responses from a server.
3. Code that sends untrusted data to the `node:zlib` Brotli functions.

**Effect on Bunker.** The page has no Node.js. The build reads only local files. The only tool that uses the network was the weekly explorer link check, which used `fetch()`. We changed it (P-24).

The fixed versions are 22.23.4, 24.22.1 and 26.12.1. Node.js 20, 23 and 25 get no fix.

### npm package attacks

In 2026, attackers took over the accounts of npm maintainers and published bad versions of popular packages. Some versions spread like a worm: an install script steals tokens and then publishes more bad packages. Other attacks changed a publish workflow or a release file.

**Effect on Bunker.** The project has zero npm packages. `npm install` installs nothing. There is no install script to run.

## Controls

| Control | What it stops | Where | Test |
|---|---|---|---|
| Zero dependencies | Bad npm packages | `package.json` | `test/supply-chain.test.js` |
| No install scripts in `package.json` | Code that runs on `npm install` | `package.json` | `test/supply-chain.test.js` |
| `ignore-scripts=true` in `.npmrc` | Install scripts if somebody adds a package by mistake | `.npmrc` | `test/supply-chain.test.js` |
| Imports only from `node:` and project files | A hidden package import | all code | `test/supply-chain.test.js` |
| Node.js version gate | Builds on a Node.js release with known flaws | `tools/check-node.js`, `engines` in `package.json`, `.nvmrc` | `test/supply-chain.test.js` |
| CI installs the official Node.js 24.22.1 build and checks its SHA-256 hash | A changed or old Node.js in CI | `.github/workflows/` | `test/supply-chain.test.js` |
| No third-party CI actions | A changed action that steals the token | `.github/workflows/` | `test/supply-chain.test.js` |
| CI token can only read | A stolen token that pushes code | `permissions: contents: read` | review |
| The tools never decompress network data | CVE-2026-111497 and similar decoder flaws | `tools/check-links.js` uses `node:https` and reads only the status code | `test/supply-chain.test.js` |
| Reproducible build; CI compares `dist/` and `site/` with a fresh build | A changed file in the repository | `.github/workflows/ci.yml` | CI step |
| The font file has a pinned SHA-256 hash | A changed font file | `tools/build.js` | build |
| CSP script and style hashes | A changed script or style in the page | the page | `test/security.test.js` |
| The host runs no build | A bad package or Node.js on the host | `site/` is committed | ADR-025 |

## What to do after a new Node.js security release

1. Read the release notes on <https://nodejs.org/en/blog>.
2. Install the new LTS version on your computer.
3. In `tools/check-node.js`, change `PATCHED` and `PINNED`.
4. In `.nvmrc`, write the new version.
5. In both workflow files, change the version and the SHA-256 hash. Copy the hash from `https://nodejs.org/dist/v<version>/SHASUMS256.txt`.
6. Run `npm run check`.

## What to do if you think a build computer is compromised

1. Stop. Do not publish.
2. Rotate the GitHub tokens and SSH keys of that computer.
3. Build again on a clean computer.
4. Compare the new SHA-256 hash with the published hash. They must be the same, because the build is reproducible.
