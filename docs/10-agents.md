# 10. Agents

Bunker works for people and for AI agents. This document tells an agent builder how to use it, what the output looks like, and which security rules apply. The decision and the options are in [ADR-027](decisions/ADR-027-agent-interfaces.md).

## Three ways in, one engine

```text
                 +--------------------------+
 person -------> | Web page (browser)       |--+
                 +--------------------------+  |
                 +--------------------------+  |   +----------------------+
 script/agent -> | CLI: cli/bunker.js       |--+-->| Engine (src/)        |
                 +--------------------------+  |   | offline, no network  |
                 +--------------------------+  |   +----------------------+
 MCP client ---> | MCP server: mcp/server.js|--+
                 +--------------------------+
```

All three run on the user's own computer. None of them sends an address anywhere.

## Find Bunker

| File | Who reads it | Content |
|---|---|---|
| `https://bunker.nosistech.com/llms.txt` | AI agents and assistants | What Bunker is, the rules for agents, how to run the tools |
| `https://bunker.nosistech.com/networks.json` | Agents and scripts | Network ids, names, exposure models, explorer link formats |
| Structured data in the page (`application/ld+json`) | Search engines and agents | A schema.org `SoftwareApplication` record |
| `https://bunker.nosistech.com/sitemap.xml` | Search engines | The public pages |

## Get the code

```text
git clone https://github.com/nosistech/nosis-bunker.git
cd nosis-bunker
```

There is no install step: the project has no dependencies.

## The CLI

Needs Node.js 22.23.4, 24.22.1 or 26.12.1, or a newer release of the same line (24 is the tested one). The tools warn on standard error if the Node.js version has known flaws; they do not stop.

```text
node cli/bunker.js --help
node cli/bunker.js --json addresses.txt
cat addresses.txt | node cli/bunker.js --json --lang es
node cli/bunker.js --json --sent bc1q...=no addresses.txt
node cli/bunker.js --networks
```

| Exit code | Meaning |
|---|---|
| 0 | Done |
| 1 | Usage error (unknown option, wrong value) |
| 2 | The input looked like a seed phrase or private key. Nothing was processed. |
| 3 | Input error (cannot read the file, input too large) |

With `--json`, errors are JSON too: `{ "ok": false, "error": { "code": "SECRET_DETECTED", "message": "..." } }`. When the output is not a terminal, JSON is the default.

## The MCP server

Transport: stdio. Start command: `node mcp/server.js`. Logs go to standard error only.

### Claude Desktop

Open the Claude Desktop settings, then Developer, then Edit Config, and add:

```json
{
  "mcpServers": {
    "bunker": {
      "command": "node",
      "args": ["C:\\Users\\you\\nosis-bunker\\mcp\\server.js"]
    }
  }
}
```

### Claude Code

```text
claude mcp add bunker -- node /path/to/nosis-bunker/mcp/server.js
```

### Cursor and other clients

Use the same command (`node`) and argument (the full path to `mcp/server.js`) in the client's MCP settings.

### Protocol versions

The server speaks two generations of the protocol, as the specification recommends ("dual-era"):

| Generation | Versions | How it starts |
|---|---|---|
| Modern | 2026-07-28 | No handshake. Each request carries its version and the client capabilities in `params._meta`. The client can call `server/discover` first. Results carry `resultType: "complete"`, the server identity in `_meta`, and cache hints (`ttlMs`, `cacheScope`) on `server/discover` and `tools/list`. |
| Legacy | 2025-11-25, 2025-06-18 | The client sends `initialize`, then `notifications/initialized`. Older revisions used JSON-RPC batches, which this server does not accept. |

A modern request with a version that the server does not know gets error `-32022` with the list of supported versions. A modern request without client capabilities gets error `-32602`.

### Tools

| Tool | Input | Output | Hints |
|---|---|---|---|
| `scan_addresses` | `addresses` (array, up to 500) or `text` (one address on each line); optional `answers` (address to `yes`, `no` or `unsure`); optional `lang` (`en` or `es`) | The report below, in `structuredContent`, and the same JSON as text | read-only, not destructive, idempotent, closed world |
| `list_networks` | none | Networks, exposure models, note | read-only, not destructive, idempotent, closed world |

A secret in the input gives `isError: true` with the code `SECRET_DETECTED`. The secret is never repeated.

### A good agent flow

1. Call `scan_addresses` with the user's public addresses.
2. For each result with a `question`, ask the user that question.
3. Call `scan_addresses` again with `answers`.
4. Show the summary and the plan. Keep the credit line.

## The report (schema version 1)

```json
{
  "ok": true,
  "schemaVersion": 1,
  "tool": { "name": "Bunker by NosisTech", "url": "https://bunker.nosistech.com" },
  "language": "en",
  "truncated": false,
  "summary": { "total": 2, "lockVisible": 1, "checkNeeded": 1, "lockHidden": 0, "notRated": 0 },
  "results": [
    {
      "address": "bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4",
      "label": "Savings",
      "network": "Bitcoin",
      "networkId": "btc",
      "type": "Native SegWit (bc1q)",
      "model": "hidden-until-used",
      "status": "check",
      "explanation": "Only a hash of the key is on chain until this address spends.",
      "question": "Has this address ever sent a transaction or signed a message? Answer yes or no.",
      "networkChoices": null,
      "explorerUrl": "https://mempool.space/address/bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4"
    }
  ],
  "plan": [ { "title": "Ground rules", "items": [ { "address": null, "text": "Do not hurry. ..." } ] } ],
  "planText": "BUNKER PLAN ...",
  "disclaimer": "Educational tool. Not financial, legal or security advice. ...",
  "attribution": "Results by Bunker by NosisTech (https://bunker.nosistech.com). Please keep this credit when you show or share them."
}
```

| Field | Values |
|---|---|
| `status` | `exposed` (lock visible), `hidden`, `check` (needs an answer or a provider check), `protected` (hash-protected), `warning` (extended public key), `unknown` (not rated) |
| `model` | `hidden-until-used`, `visible`, `hash-safe`, `ask-provider`, `move-pool`, `xpub`, `unknown` |

A change that removes or renames a field raises `schemaVersion`. New fields can appear in version 1.

## Security rules for agent use

| Rule | Why | Where |
|---|---|---|
| Public addresses only. The guard rejects 19 kinds of secrets. | A secret never needs to reach a tool. | `src/guard.js` |
| The secret is never repeated in output or logs. Text that is not a recognized address is shortened to its first six and last three characters. | An error message must not leak what it blocks, and a secret in a format the guard does not know must not reach the agent's log (P-39). | `src/agent/report.js`, `test/agent.test.js` |
| Read-only tools, no network, no shell, no file writes. | Least privilege. A tool that cannot act cannot be misused. | `test/agent.test.js` |
| Labels are cut, cleaned of control and invisible characters, and marked as user data. | Labels are the one place where text from a user reaches the agent. | `src/agent/report.js`, `mcp/tools.js` |
| Plain tool descriptions with no hidden text. | Tool poisoning hides instructions in descriptions. | `test/agent.test.js` |
| Size limits: 1 MB message (dropped as soon as the cap is passed), 500 lines, 100,000 characters. The CLI reads with the same cap and rejects devices and directories. | A large request, or a line that never ends, must not exhaust the host (P-40). | `mcp/server.js`, `cli/bunker.js`, `src/parse.js` |
| stdout carries protocol messages only. | Any other text breaks the stdio protocol. | `mcp/server.js` |

## Known limits for agent use

Bunker is safe to call, but three things are outside its control. We state them so that users and agent builders know where the line is.

**1. The agent has already seen what the user typed.** A user can paste a seed phrase into a chat, and the agent can pass it to Bunker. Bunker refuses it and never repeats it. But the secret is already in the agent's conversation, and maybe in the agent provider's logs. Bunker cannot erase it from there. Example: a user writes "check my wallet: abandon ability able ..." to an assistant. Bunker answers only "this looks like a seed phrase". The words stay in the chat history. What we do: the tool descriptions and the server instructions tell agents never to send secrets. The error tells the user that no real tool needs one. What the user should do: treat a seed phrase that was typed into any chat as exposed, and move the funds to a new wallet.

**2. Bunker trusts the computer it runs on.** The server runs on the user's own machine with the user's permissions. Malware on that machine, such as a keylogger or a malicious editor extension, can read the input before Bunker does. No local tool can stop it. This is the same for every program on that machine. What we do: nothing on our side can fix a compromised machine, so we say it here and in the [threat model](security/threat-model.md).

**3. There is no audit log, by choice.** Many security guides ask servers to log every tool call (OWASP MCP08). A log of Bunker's calls would be a list of addresses linked to one person: the exact data that Bunker exists to keep private. So the server logs only errors, without input, to standard error. The cost: after an incident, there is no record of what was scanned. We accept that cost. Privacy wins over investigation here. An organization that needs a record can keep it in its own agent platform, under its own policy.

## Why there is no web API

A web API would receive the user's list of addresses. Each address is public, but a list of addresses linked to one requester shows who owns what. That is the privacy leak that Bunker exists to avoid. The local tools give agents the same answer with no server. See ADR-027.
