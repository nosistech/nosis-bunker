# Bunker by NosisTech

Bunker is an offline scanner for crypto addresses. You paste your addresses. The tool shows which addresses show their public key to the world. Then it gives you a calm plan, step by step, to hide what you can.

The tool runs only on your device. It does not connect to a wallet. It does not send or store anything. It knows more than 100 networks. It works in English and Spanish, for people and for AI agents.

> **Safety first.** Bunker needs only your public addresses. Do not paste a seed phrase or a private key into this tool or into any other website. The tool blocks secrets if you paste them by mistake.

## Contents

- [Why this tool exists](#why-this-tool-exists)
- [Use the tool](#use-the-tool)
- [Use Bunker with AI agents](#use-bunker-with-ai-agents)
- [An example](#an-example)
- [What the results mean](#what-the-results-mean)
- [Build and test the tool](#build-and-test-the-tool)
- [Project map](#project-map)
- [Documentation](#documentation)
- [Security](#security)
- [Credit and attribution](#credit-and-attribution)
- [License and disclaimer](#license-and-disclaimer)

## Why this tool exists

I see AI advancing at an alarming rate. AI models now solve math problems that stayed open for decades. The signatures that protect most crypto wallets depend on math problems that nobody has solved yet. Nobody has broken them today. But I do not want to wait for the day that someone does. Crypto needs extra security now.

The first step is simple: keep your funds on addresses whose public key the world has never seen. Most people do not know which of their addresses show the public key. Bunker gives that answer in about 30 seconds, with a plan to fix what you can.

Carlos A. Paredes Vargas, founder of NosisTech

Read [docs/01-background.md](docs/01-background.md) for the full story.

## Use the tool

You do not need to install anything.

Open <https://bunker.nosistech.com>, or use the file on your own computer:

1. Download the file from <https://bunker.nosistech.com/nosis-bunker.html>. On GitHub, open `dist/nosis-bunker.html` and select the download icon ("Download raw file").
2. Optional: examine the file hash (see below).
3. Double-click the file. It opens in your web browser. If Windows asks which app to use, pick your browser.
4. Paste your addresses, one on each line. You can put a label after a space.
5. Select **Scan addresses**.
6. For each address that asks, answer the question: "Has it ever sent a transaction or signed a message?"
7. Read the plan next to the results. Select **Copy plan** or **Print** to keep it.

The tool works with no internet connection. You can turn on airplane mode before you open the file.

### Examine the file hash (Windows)

The hash proves that your file is the same as the file in this repository.

1. Open your Downloads folder in File Explorer. Right-click an empty area and select **Open in Terminal**.
2. Type this command and press Enter:

   ```powershell
   Get-FileHash .\nosis-bunker.html -Algorithm SHA256
   ```

3. Compare the result with the value in `dist/SHA256SUMS.txt` or at <https://bunker.nosistech.com/SHA256SUMS.txt>. The two values must be the same. Letter case does not matter.

On macOS or Linux, use `shasum -a 256 nosis-bunker.html`.

### Language and theme

Use the **EN / ES** switch and the sun or moon button at the top. The page starts in the language and the color theme of your system. It saves nothing, so a new visit starts from your system settings again. To open the page in Spanish, use <https://bunker.nosistech.com/#es>.

## Use Bunker with AI agents

The same engine is available to AI agents in two local forms. Both run offline, read only, and need Node.js 22.23.4, 24.22.1 or 26.12.1, or a newer release of the same line (24 is the tested one). Get the code with `git clone https://github.com/nosistech/nosis-bunker.git`. There is no install step.

**Command line (JSON):**

```text
node cli/bunker.js --json addresses.txt
cat addresses.txt | node cli/bunker.js --json --lang es
node cli/bunker.js --networks
```

**MCP server (Claude Desktop, Claude Code, Cursor and other MCP clients):**

```json
{
  "mcpServers": {
    "bunker": { "command": "node", "args": ["C:\\path\\to\\nosis-bunker\\mcp\\server.js"] }
  }
}
```

Tools: `scan_addresses` and `list_networks`. The website also has [`/llms.txt`](https://bunker.nosistech.com/llms.txt) and [`/networks.json`](https://bunker.nosistech.com/networks.json). Read [docs/10-agents.md](docs/10-agents.md) for the details, the JSON shape and the security rules.

## An example

You paste these three lines:

```text
bc1p5cyxnuxmeuwuvkwfem96lqzszd02n6xdcjrs20cac6yqjjwudpxqkedrcr Ordinals
bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4 Savings
0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed Daily wallet
```

The tool shows:

| Address | Result | Why |
|---|---|---|
| `bc1p...` Ordinals | Lock visible | A Taproot address contains the public key. |
| `bc1q...` Savings | Check needed | The key stays hidden until the address spends. You answer "No", so the result becomes **Lock hidden**. |
| `0x5a...` Daily wallet | Check needed | You answer "Yes" because you used it. The result becomes **Lock visible**. |

The plan then says: move the daily wallet funds to a new account that only receives. Keep the inscriptions on Taproot until Bitcoin activates BIP-360. Keep the savings address hidden.

## What the results mean

| Result | Meaning | What to do |
|---|---|---|
| Lock visible | The public key is on chain or in the address. | Move to a hidden address type if the network has one. |
| Check needed | The key is hidden until the address sends or signs. | Answer the question on the card. |
| Lock hidden | The key has never been shown. | Use this address only to receive. |
| Hash-protected | The address type has no curve key (for example BIP-360). | Nothing. |
| Ask your provider, Check your pool | A permissioned network, such as Canton, or a Zcash unified address, whose pool decides the risk. | Ask the operator the questions in the plan, or check the pool. |
| Shows every key | An extended public key (xpub). | Stop sharing it with apps and trackers. |
| Not rated | A typo, a test network, a contract, or an unknown format. | Read the note on the card. |

## Build and test the tool

You need Node.js 22.23.4, 24.22.1 or 26.12.1, or a newer release of the same line (24 is the tested one). Older versions and the odd-numbered lines (23, 25) have known security flaws or no security fixes, and the build tools stop on them. The CLI and the MCP server only warn. The project has no other dependencies.

### Windows, step by step

1. Install Node.js LTS from <https://nodejs.org>. Use the default options.
2. Open the project folder in File Explorer.
3. Right-click an empty area and select **Open in Terminal**.
4. Type `node --version` and press Enter. The result must be `v24.22.1` or a newer 24 release.
5. Type `npm test` and press Enter. All tests must pass.
6. Type `npm run build` and press Enter. The tool writes `dist/nosis-bunker.html` and the website folder `site/`.

### Commands

| Command | What it does |
|---|---|
| `npm test` | Runs all tests (`node --test`). |
| `npm run build` | Checks the Node.js version, then builds `dist/` and `site/`. |
| `npm run check` | Version check, build, tests and the writing check together. |
| `npm run check-links` | Opens every explorer link once. This command uses the internet. |

Read [docs/08-testing.md](docs/08-testing.md) to learn how to read the test results.

## Project map

```text
nosis-bunker/
  dist/                  the built page (one file) and its SHA-256 hash
  site/                  the website for bunker.nosistech.com (made by tools/site.js)
  src/
    core/                hashes and encodings: SHA-256, SHA-512/256, Keccak, BLAKE2b, Base58, Bech32, ...
    networks/            one small detector for each network family
      index.js           the detector pipeline and its order
    model.js             the exposure model and the card status rules
    chains.js            network names and verified explorer links
    guard.js             the secret guard (seed phrases and private keys)
    classify.js          one address in, one result out
    parse.js             the input box in, a list of results out
    advice.js, plan.js   the bunker plan
    explorer.js          safe explorer links
    i18n/                English to Spanish
    agent/               the JSON report for the CLI and the MCP server
    ui/                  the page: template.html, styles.css and the page modules
  cli/                   command-line tool for people and agents (JSON output)
  mcp/                   MCP server for AI agents (stdio)
  audit/                 accessibility audit script (manual release step)
  tools/                 build, website, files for agents, Node.js version gate, writing check, link check
  test/                  tests and real address fixtures
  docs/                  all documentation
  deploy/                Caddy configuration for a VPS
```

Every core, network and pipeline module is less than 100 lines. Read [docs/04-architecture.md](docs/04-architecture.md) for the data flow.

## Documentation

| Document | Content |
|---|---|
| [01 Background](docs/01-background.md) | Why the tool exists, the sealed-box idea, and examples. |
| [02 How it works](docs/02-how-it-works.md) | The five steps from input to plan. |
| [03 Networks](docs/03-networks.md) | Every network, its format, its rule and its checksum. |
| [04 Architecture](docs/04-architecture.md) | Modules, data flow, and how to add a network. |
| [05 How it was built](docs/05-how-it-was-built.md) | The story of the build and the main choices. |
| [06 Problems and fixes](docs/06-problems-and-fixes.md) | Each problem, the options, and the fix. |
| [07 UX and UI](docs/07-ux-ui.md) | Design choices for the page. |
| [08 Testing](docs/08-testing.md) | What the tests prove and how to run them. |
| [09 Glossary](docs/09-glossary.md) | The words in this project. |
| [Decision records](docs/decisions/README.md) | 30 decisions, each with two or more options. |
| [Security](docs/security/owasp.md) | OWASP mapping, threat model, supply chain and hosting. |
| [10 Agents](docs/10-agents.md) | The CLI, the MCP server, llms.txt and the JSON report. |
| [11 Accessibility](docs/11-accessibility.md) | WCAG 2.2 AA target, test method and results. |
| [Writing style](docs/WRITING-STYLE.md) | The writing rules that the docs follow. |

## Security

Read [SECURITY.md](SECURITY.md). In short:

- The page has a strict Content Security Policy with script and style hashes. It blocks all network connections.
- The code uses no `innerHTML` and no `eval`. Tests fail the build if this changes.
- The project has zero dependencies. The CI uses no third-party actions.
- The build tools run only on a patched Node.js, and the CLI and the MCP server warn on one. CI installs an exact Node.js build and checks its hash. See [supply chain](docs/security/supply-chain.md).
- The website is a prebuilt folder. The host runs no build. See [hosting](docs/security/hosting.md).

## Credit and attribution

Bunker is free so that as many people as possible can use it. If you use it, host it, build on it or show its results, please give credit:

```text
Bunker by NosisTech (https://bunker.nosistech.com)
```

This is a request, not a condition. When you redistribute the code, the license requires a copy of the license, the NOTICE text and a note in changed files, and nothing more. The CLI, the MCP server and the plan text include this credit, so it travels with the results.

## License and disclaimer

Apache License 2.0. Copyright 2026 NosisTech LLC. Created by Carlos A. Paredes Vargas. See [LICENSE](LICENSE) and [NOTICE](NOTICE).

You can use, copy, change and sell this tool. If you redistribute it or a work based on it, you must keep the text of the [NOTICE](NOTICE) file, which names the author. The license gives no right to use the names "Bunker by NosisTech" or "NosisTech", except to say where the code comes from (section 6). Do not present a changed copy as the official version.

Bunker is an educational tool. It is not financial, legal or security advice. It has no warranty. Examine each address on a block explorer and send a small test amount before you move funds.
