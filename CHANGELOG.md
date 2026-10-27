# Changelog

## 1.2.2 (2026-10-27)

A documentation review compared the docs, the decision records and the tests with the code.

- Plan advice: Litecoin Taproot and MWEB advice names `ltc1q` and no longer mentions BIP-360, a Bitcoin proposal (P-43).
- Shared formats: Starknet is offered only for values below 2^251, in the 64-digit and the 63-digit forms (P-44).
- Canton: the plan asks the three provider questions of ADR-012 (P-45).
- Tests: a real P-37 case with the Solana shape (P-46), and tests for P-43 to P-45.
- Docs: the README results table names a Zcash unified address, not Sapling. Also fixed: the test summary in 08-testing.md, the file of `uiEl` in ADR-019, and the Starknet rule in ADR-011 and P-02.

## 1.2.1 (2026-10-25)

A full review pass: network rules, security, Spanish and documentation, each by a separate reviewer.

- Network rules: a Bech32 typo can no longer pass as a Solana address (P-37). Ten formats now check their encoding, header or checksum (P-41): SegWit versions, Silent Payments, Zcash, Cardano, Filecoin f410, Ronin, XDC, TON test addresses, DigiByte script addresses, Solana programs.
- Seed guard: numbered, upper-case and non-English seed phrases (P-33). WIF keys of more coins (P-34). Eight more key formats, and the forms that tried to slip past the guard (P-42). A list of labeled addresses no longer looks like a seed phrase (P-38).
- Agent interfaces: the MCP server serves the stateless protocol revision 2026-07-28 and the handshake revisions (P-35). It caps each message at 1 MB and flushes its replies (P-40). The CLI caps its input and rejects devices and directories. Unrecognized text is shortened in reports (P-39). Error messages come in Spanish when asked.
- Labels: control and direction characters removed everywhere (P-36).
- Page: dropped text is checked for secrets like pasted text. The hint for 64 hex characters explains the `near:` convention.
- Docs: EU software law section in the standards document, the protocol versions section, and the problem entries P-33 to P-42.

## 1.2.0 (2026-10-25)

- New name: Bunker by NosisTech.
- English and Spanish, with a switch (ADR-028). Every engine text has a Spanish version, and a test checks it.
- Light and dark switch. The language and the theme start from the system settings and store nothing (ADR-029).
- Agent-ready: a CLI with JSON output, a local MCP server, `llms.txt`, `networks.json`, structured data and a sitemap (ADR-027).
- Accessibility: WCAG 2.2 AA target, axe-core audit with no violations, an accessibility statement (ADR-030).
- A legal notice on the page, and a credit request in the README.
- Contact: info@nosistech.com in the footer and in `security.txt`.
- Fixes P-27 to P-32.

## 1.1.0 (2026-10-25)

- New page design for https://bunker.nosistech.com. The headline and the scanner share the first screen.
- A one-sentence result, an exposure meter, and the plan next to the results.
- A field guide, print support, and Ctrl + Enter to scan.
- One embedded open-license font (Archivo), with a pinned hash (ADR-024).
- Website folder `site/` with security headers and `security.txt` (ADR-025).
- Node.js version gate and pinned Node.js 24.22.1 in CI, after the October 21, 2026 Node.js security release (ADR-026).
- The link check no longer decompresses network data (P-24).
- Keyboard focus stays in place after an answer (P-25).
- New supply-chain tests.

## 1.0.0 (2026-10-25)

First release of the repository.

- More than 100 networks, with checksum validation for every format that has one.
- Secret guard for 16 kinds of secrets.
- Ordered detector pipeline: 17 detectors, each under 100 lines.
- Strict Content Security Policy with script and style hashes, and Trusted Types.
- Page built with DOM methods only. No `innerHTML`.
- Zero dependencies. Own build script. Reproducible build.
- Tests with 57 real public addresses and a typo test for each one.
- Fixes from the prototype: P-01 to P-22 in [docs/06-problems-and-fixes.md](docs/06-problems-and-fixes.md).
- Documentation with strict writing rules, with 23 decision records.
- License: Apache-2.0 with a NOTICE file that names the author.

## Prototype (2026-10-07 to 2026-10-25)

- Single HTML page, first published as "Bunker Check".
