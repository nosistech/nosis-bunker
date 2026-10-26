# ADR-026. Pin and gate the Node.js version of the tools

Status: Accepted. Date: 2026-10-25.

## Context

The tools (build, tests, link check) run on Node.js. On October 21, 2026, Node.js fixed ten flaws, one of them a remote code execution flaw in the Brotli decoder (CVE-2026-111497). Node.js 20 reached end of life in April 2026 and gets no fix. The old setting `engines: >=20` allowed both.

## Options

| Option | For | Against |
|---|---|---|
| A. Use whatever Node.js is installed | Easy | A build can run on a version with known flaws |
| B. `engines` in `package.json` only | Standard | npm only warns, and only for `npm install`; `node tools/build.js` ignores it |
| C. `actions/setup-node` in CI | Common | A third-party action (ADR-023) |
| **D. A version gate script, `engines` with `engine-strict`, `.nvmrc`, and CI that downloads the official Node.js build and checks its SHA-256 hash** | Fails early everywhere; no third-party action; the CI version is exact | One table to update after each Node.js security release |

## Decision

Option D.

- `tools/check-node.js` lists the first patched release of each supported line: 22.23.4, 24.22.1 and 26.12.1. Odd lines (23, 25) and old lines (20 and older) fail.
- `npm run build`, `npm run check` and the link check run the gate first. A test also runs it.
- CI downloads `node-v24.22.1-linux-x64.tar.xz` from nodejs.org and checks the SHA-256 hash from the official `SHASUMS256.txt`.

## Consequences

- After each Node.js security release, update the table, `.nvmrc` and the two workflow files. The steps are in [supply-chain.md](../security/supply-chain.md).
- The page itself does not change. The browser never runs Node.js.
