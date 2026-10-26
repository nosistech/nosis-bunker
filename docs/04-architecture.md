# 04. Architecture

This document shows how the code is organized, how data moves, and how to add a network.

## Design rules

The project follows these rules. Most of them have a test or a check.

- Every core, network and pipeline module is less than 100 lines (layers 1 to 3 below). The page controller is about 180 lines.
- One module has one job. Functions take data and return data.
- No network code, no storage, no `innerHTML`, no `eval`. Tests fail the build if this changes.
- Plain JavaScript with type notes in comments. No dependencies. The built page keeps the comments.
- Each network family is one detector. A new network needs one file and one line in the pipeline.
- No server, no API, no account, no cookie, no analytics.

## Layers

The code has five layers. A layer can use the layers below it. It cannot use the layers above it.

```text
+------------------------------------------------------------------------+
| 5. Interfaces  src/ui/   the page: app.js, render.js, prefs.js, dom.js,  |
|                          state.js, text.js, template.html, styles.css    |
|                cli/      command-line tool (JSON or text)                |
|                mcp/      MCP server for AI agents (stdio)                |
+------------------------------------------------------------------------+
| 4. Report      src/agent/report.js  one JSON shape for machines          |
|                src/i18n/            English to Spanish                   |
+------------------------------------------------------------------------+
| 3. Pipeline    parse.js -> guard.js, classify.js -> plan.js              |
+------------------------------------------------------------------------+
| 2. Networks    src/networks/*.js  (17 detectors, 4 helpers, index.js)    |
|                model.js, chains.js, explorer.js                          |
+------------------------------------------------------------------------+
| 1. Core        src/core/*.js  (hashes and encodings)                     |
+------------------------------------------------------------------------+
```

- **Core** knows nothing about networks. It has hashes (SHA-256, SHA-512/256, Keccak-256, BLAKE2b, CRC-32, CRC-16) and encodings (Base58, Bech32, Blech32, CashAddr, Base32, Base64, Monero Base58, c32).
- **Networks** know formats and rules. They return a frozen `Verdict` object. They do not know about the page.
- **Pipeline** connects the steps: guard, parse, classify, plan. It writes English only.
- **Report and translation** turn results into a stable JSON shape (version 1) and into Spanish when asked (ADR-028).
- **Interfaces** show the results. The page is the only part that touches the browser. The CLI and the MCP server read standard input and write standard output. None of them has network code.

The page and the agent tools share the same engine. A fix in a detector fixes all three.

## The Verdict object

Every detector returns the same shape. The shape is defined in [src/model.js](../src/model.js).

```js
{
  chain: 'btc',                      // key into CHAINS, or null
  type: 'Taproot (bc1p)',            // short label for the card
  model: 'visible',                  // one of MODEL
  why: 'Taproot puts the public key in the address. ...',
  explorer: undefined,               // optional template that replaces the CHAINS default
  options: undefined,                // optional list of networks for the user to pick
}
```

The object is frozen with `Object.freeze`. No later step can change it by mistake.

## The detector pipeline

[src/networks/index.js](../src/networks/index.js) holds the list of detectors. `classify()` calls them in order. The first detector that returns a result wins.

The order matters. Three examples:

1. **Token contracts come first.** The QNT contract is a valid `0x` address. Without this order, the EVM detector would rate the contract as a wallet.
2. **Lightning comes before Bech32.** A Lightning invoice is valid Bech32. The general Bech32 detector would call it an "unknown Bech32 address".
3. **Stacks comes before Base58.** A Stacks address uses its own alphabet. Some Stacks addresses are also valid Base58 text.

Each line in `index.js` has a comment that gives the reason for its position.

## Data flow for one address

```text
"bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4 Savings"
  |
  | parse.js: address = "bc1q...", label = "Savings"
  v
classify("bc1q...")
  | known-contracts: no
  | identifiers: no
  | ... (10 more: no)
  | bech32: bech32Decode() -> hrp "bc", version 0, 20 bytes
  |         bitcoinBech32Verdict() -> Native SegWit, hidden-until-used
  v
Entry { chain: 'btc', model: 'hidden-until-used', label: 'Savings', sent: 'unsure', ... }
  |
  | user selects "No"
  v
statusOf() -> 'hidden'  ->  plan group "Keep these locks hidden"
```

## How to add a network

Example: add a fictional network "Example Chain" with addresses `exm1...` (Bech32, hash of the key).

1. **Find the format.** Read the official documentation. Write down the prefix, the encoding, the checksum and the payload length.
2. **Find a real address.** Use an address from an official test vector or a public explorer page. Do not use a private person's address.
3. **Choose the place.** For a Bech32 hash address, add one line to `BECH32_RULES` in `src/networks/bech32-family.js`:

   ```js
   exm: ['hashacct', 'Example Chain account', MODEL.HIDDEN_UNTIL_USED, TEXT.HASH_HIDDEN, { chainLabel: 'Example Chain' }],
   ```

   For a new encoding, make a new file in `src/networks/` with one exported `detectX()` function. Add it to `DETECTORS` in `index.js` with a comment for its position.
4. **Add the explorer link only if you can verify it.** Open the explorer page for a real address. Copy the URL pattern. Put it in `src/chains.js` or in the rule.
5. **Add a test.** Add the real address to `test/fixtures/addresses.json` with its source.
6. **Run the checks.** Type `npm run check`. All tests must pass.
7. **Update the docs.** Add the network to `docs/03-networks.md`.

## The build

[tools/build.js](../tools/build.js) makes one HTML file from all modules. It has no dependencies.

1. It starts at `src/ui/app.js` and follows the `import` lines.
2. It orders the modules so that each module comes after the modules it uses.
3. It removes the `import` lines and the `export` keywords.
4. It stops with an error if two modules declare the same top-level name.
5. It wraps all code in one function, so nothing goes into the global scope.
6. It computes SHA-256 hashes of the script and the styles, and writes them into the Content Security Policy.
7. It writes `dist/nosis-bunker.html` and `dist/SHA256SUMS.txt`.

The build gives the same file every time. A test proves this. Read [ADR-005](decisions/ADR-005-build-script.md) for the reasons.

### Module syntax rules

The build supports a small part of JavaScript module syntax. This keeps the build script short and easy to audit.

- Import: `import { a, b } from './file.js';` on one line.
- Export: `export function`, `export const` or `export let` only.
- Not allowed: `export default`, `export { }`, `export *`, dynamic `import()`, packages from `node_modules`.

The build stops with a clear error if a module breaks a rule.
