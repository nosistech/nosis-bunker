# 08. Testing

This document tells what the tests prove, how to run them, and how to read the result.

## Run the tests

1. Open a terminal in the project folder.
2. Type `npm test` and press Enter.

The tests use `node:test`, which is part of Node.js. You do not install anything.

## Read the result

At the end, Node.js shows a summary:

```text
# tests 58
# pass 58
# fail 0
```

- `pass` is the number of tests that worked.
- `fail` must be 0. If it is not 0, find the lines that start with `not ok`. Below each one, `error:` tells what went wrong.

**Example of a failure:**

```text
not ok 16 - one changed character is never accepted as the same valid address
  error: 'XRP Ledger genesis account: typo not detected (XRP account)'
```

This line says: the test changed one character of the XRP address, and the tool still said "XRP account". That was a real problem (P-19), and this test found it.

## What each test file proves

| File | What it proves |
|---|---|
| `test/core.test.js` | Every hash and encoding gives the correct result. SHA-256, SHA-512, SHA-512/256 and BLAKE2b are compared with Node's own crypto library. Keccak-256, CRC-32, Bech32, CashAddr, Monero and c32 use published test values. |
| `test/networks.test.js` | 57 real public addresses get the correct network and model. One changed character always fails. Sample addresses cover formats with no public example. Wrong encodings, bad headers and bad checksums are reported as such and never as another network (P-37, P-41). |
| `test/guard.test.js` | The guard blocks 19 kinds of secrets, in nine forms and languages for seed phrases, and in the forms that tried to slip past it (glued numbering, invisible characters, JSON quotes, credential files). It does not block 8 kinds of real input that look like secrets. Input limits work. |
| `test/plan.test.js` | The status rules, the order of the plan, and safe explorer links. |
| `test/security.test.js` | The built page has no network code, no storage, no dangerous DOM calls and no `eval`. The Content Security Policy is strict and its hashes match. Fonts and the tab icon come only from data URLs. The build gives the same file every time. No em dashes in the page or the docs. |
| `test/i18n.test.js` | Every engine sentence, every result for the real addresses and their typos, and every plan step has Spanish. Both languages have the same page text. |
| `test/agent.test.js` | The CLI gives a stable JSON report, the right exit codes, redacts unrecognized text and caps its input. The MCP server answers both protocol generations, lists read-only tools and handles secrets, bad input, oversized and bad messages safely, in both languages. No agent code can use the network, a shell or write files. Tool descriptions contain no hidden text. |
| `test/supply-chain.test.js` | No npm packages and no install scripts. Code imports only Node.js built-ins and project files. The tools never decompress network data. The Node.js version gate works, and the running Node.js is patched. CI pins and hash-checks Node.js. The committed website matches a fresh build. |

## Where the test addresses come from

Every address in `test/fixtures/addresses.json` has a `source` field. The sources are:

- Published test vectors (BIP-173, BIP-86, BIP-352, BOLT 11, EIP-55, CashAddr).
- Development accounts (the Polkadot and Kusama account "Alice").
- Well-known public addresses (the Bitcoin genesis address, the XRP genesis account, token contracts).
- Addresses shown on public explorer pages.

None of these addresses belongs to the authors or to a private person.

## The typo test

The typo test is the most important test. For each real address, it changes one character near the end and runs the tool again. The result must be "Checksum failed" or "Not recognized".

Two kinds of address skip this test because their format has no checksum:

- Lowercase hex addresses (`0x...`, `xdc...`, `ronin:...`).
- Lightning node IDs (any valid hex is a possible key).

## Browser test

The project does not include a browser test runner, because it would add dependencies. Before each release, open `dist/nosis-bunker.html` in a browser and do these steps:

1. Examine the browser console. It must show no errors and no Content Security Policy messages.
2. Paste `abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about` and select Scan. The page must clear the box and show the alert.
3. Paste `<img src=x onerror=alert(1)>` and select Scan. No alert box must open. The text must show as text.
4. Make the window 320 pixels wide. The page must not scroll sideways.

The October 25, 2026 build passed these steps in Chromium.

## Other checks

| Command | What it does |
|---|---|
| `node tools/check-style.js` | Fails on em dashes in Markdown files. Reports sentences longer than 25 words. |
| `node tools/check-links.js` | Opens one link for each explorer template. Reports broken links. It uses the internet. CI runs it every week. |
