# 05. How it was built

This document tells the story of the build in order. It also lists the main choices and the options that we did not choose. Each choice has a full decision record in [decisions/](decisions/README.md).

## Phase 1. The question (October 7 to 9, 2026)

AI is advancing at an alarming rate, and wallet security depends on math that AI could one day break. This raised one question: "Which of my addresses show their lock?" No simple tool answered it. Existing tools asked for a wallet connection or sent addresses to a server.

The first decision was the most important one: **the tool runs only on the user's device.** It needs no server and no wallet connection. ([ADR-001](decisions/ADR-001-offline-client-only.md))

## Phase 2. The first prototype

The prototype was one HTML page with one large function. It knew Bitcoin, EVM, Solana, Sui, Cardano, Cosmos, TON, XRP, Tron, Stellar, Algorand, NEAR, Hedera and Polkadot.

Choices in this phase:

| Choice | We chose | Instead of | Record |
|---|---|---|---|
| Language | JavaScript, no framework | TypeScript, Rust to WebAssembly, Python | [ADR-002](decisions/ADR-002-language.md) |
| Answer for "has it sent?" | Ask the user | Look it up on a blockchain | [ADR-008](decisions/ADR-008-ask-instead-of-lookup.md) |
| Secrets | Block and clear | Warn only | [ADR-010](decisions/ADR-010-secret-guard.md) |
| Results | Named categories | A yes or no, or a score from 0 to 100 | [ADR-007](decisions/ADR-007-exposure-model.md) |

## Phase 3. Real wallets, real gaps (October 25)

A wallet app such as Xverse shows five address types. The tool did not know two of the formats: Stacks and Spark. It also had no Starknet. We added all three. ([P-01, P-02](06-problems-and-fixes.md))

Then the scope grew. The goal changed to "every network that holds real value, including the ones that banks and asset issuers use". The tool grew to more than 100 networks. This brought new problems:

- Two networks used the same prefix (`sp`). ([P-03](06-problems-and-fixes.md))
- The private key guard blocked a valid address type. ([P-04](06-problems-and-fixes.md))
- Many formats needed new checksum code: Keccak-256, BLAKE2b, CRC-32, CashAddr, Monero Base58. ([ADR-003](decisions/ADR-003-no-dependencies.md), [ADR-009](decisions/ADR-009-checksums.md))

## Phase 4. Checking our own claims

We tested the explorer links against real explorer pages. We found that the Cosmos links used the wrong path. We fixed them and removed two links that we could not verify. ([P-08, P-09](06-problems-and-fixes.md), [ADR-014](decisions/ADR-014-explorer-links.md))

We added the Liquid checksum with constants from the reference implementation. We rated Zcash shielded addresses with the analysis of the Zcash developers. ([P-06, P-07](06-problems-and-fixes.md))

## Phase 5. The repository

The prototype became this repository. The main changes:

| Change | Why |
|---|---|
| One large function became 17 detectors in a pipeline. | Each detector is small and has one job. ([ADR-006](decisions/ADR-006-detector-pipeline.md)) |
| String building with `innerHTML` became DOM building with `textContent`. | This removes the main cause of cross-site scripting. ([ADR-019](decisions/ADR-019-safe-dom.md)) |
| A Content Security Policy with hashes. | The browser blocks any code that we did not build. ([ADR-016](decisions/ADR-016-content-security-policy.md)) |
| A small build script with no dependencies. | Nothing from outside the project goes into the page. ([ADR-005](decisions/ADR-005-build-script.md)) |
| Tests with real public addresses. | The tests prove the claims in the docs. ([ADR-018](decisions/ADR-018-tests.md)) |

The new typo test found two more problems. XRP, Stellar, Algorand and TON addresses had no checksum validation. Base32 accepted two spellings of the same address. ([P-19, P-20](06-problems-and-fixes.md))

## Phase 6. The website and the October 2026 Node.js release

The tool got a public home: https://bunker.nosistech.com. The page had to work for a busy reader at first sight, on any device, and stay as strict as before.

| Change | Why |
|---|---|
| The headline and the scanner share the first screen. | The tool is the first thing a visitor sees. |
| One sentence gives the result, and a meter shows one segment for each address. | A reader understands the result in two seconds. |
| The plan stays next to the results on a wide screen. | Each answer changes the plan in view. |
| The reference text moved into a field guide with sections that open and close. | The page is short. The detail is one click away. |
| One embedded open-license font. | The same look on every device, and no request. ([ADR-024](decisions/ADR-024-embedded-font.md)) |
| A prebuilt `site/` folder. | The host runs no build. ([ADR-025](decisions/ADR-025-prebuilt-site.md)) |
| A Node.js version gate and a pinned Node.js in CI. | The tools never run on a Node.js release with known flaws. ([ADR-026](decisions/ADR-026-node-version-gate.md)) |

The review found four more problems (P-23 to P-26).

## Phase 7. Two languages, agents, accessibility, and a full review (October 25)

Version 1.2.0 added the second language, the light and dark switch, the agent interfaces and the accessibility work ([ADR-027](decisions/ADR-027-agent-interfaces.md) to [ADR-030](decisions/ADR-030-accessibility.md)).

Version 1.2.1 was a review pass with four separate reviewers, one each for the network rules, security, Spanish and the documentation. Each reviewer got the code and the specifications, not our conclusions. The pass found one critical problem: a Bech32 typo could pass as a Solana address (P-37). It also found nine formats that accepted the wrong encoding (P-41), eight key formats the guard missed (P-42), and two ways to make the MCP server hold memory or lose a reply (P-40). All are fixed. Each has a test. The entries P-33 to P-42 in [06-problems-and-fixes.md](06-problems-and-fixes.md) record them.

## The main choices at a glance

| # | Decision | Chosen | Main alternatives |
|---|---|---|---|
| 001 | Where the tool runs | User's device only | Server API; browser calls to public APIs |
| 002 | Language | JavaScript | TypeScript; Rust to WebAssembly; Python or Go |
| 003 | Libraries | None; own checksum code | npm crypto libraries; WebCrypto |
| 004 | Delivery | One HTML file | Website with many files; browser extension; mobile app |
| 005 | Build | Own script, about 190 lines | esbuild or Rollup; ES modules in the browser |
| 006 | Code structure | Ordered detector pipeline | One large function; table of regular expressions |
| 007 | Result model | Named categories | Yes or no; score from 0 to 100 |
| 008 | "Has it sent?" | Ask the user | Blockchain lookup; xpub scan |
| 009 | Typos | Verify every checksum | Shape only; external service |
| 010 | Secrets | Block and clear | Warn only; no guard |
| 011 | Shared formats | User picks the network | Guess; reject |
| 012 | Permissioned networks | Questions for the provider | Rate as visible; ignore |
| 013 | Zcash shielded | Rate by pool | No rating; rate by address |
| 014 | Explorer links | Verified only, checked weekly | Best guess; no links; one explorer for all |
| 015 | Fonts | System fonts (replaced by 024) | Google Fonts; embedded font files |
| 016 | Script policy | CSP with hashes and Trusted Types | No CSP; CSP with `unsafe-inline` |
| 017 | 64-bit math | BigInt | 32-bit pairs; WebAssembly |
| 018 | Tests | `node:test` with real addresses | Jest or Vitest; manual tests |
| 019 | Page building | DOM methods and `textContent` | `innerHTML` with escaping; a framework |
| 020 | Page design | Cards, plain labels, example data on first open | Table; empty first page |
| 021 | Writing | Strict house writing rules | Normal English; two languages |
| 022 | Token contracts | Short curated list | No list; full token list |
| 023 | Continuous integration | No third-party actions | Popular marketplace actions |
| 024 | Fonts, second version | One subset variable font in a data URL | System fonts; a font service; several files |
| 025 | Website | Commit a prebuilt `site/` folder | Build on the host; deploy from CI with a token |
| 026 | Node.js version | Gate script, exact pin and hash check in CI | Any version; `engines` only; `setup-node` action |
| 027 | Agent access | Local CLI and MCP server; llms.txt; no web API | Remote API or remote MCP; browser automation only |
| 028 | Languages | English engine, Spanish dictionary in the page | English only; two pages; message keys |
| 029 | Saved preferences | None; system settings and `#es` | localStorage; cookies |
| 030 | Accessibility | WCAG 2.2 AA with tests and a statement | No target; overlay widget; WCAG 2.1 only |
