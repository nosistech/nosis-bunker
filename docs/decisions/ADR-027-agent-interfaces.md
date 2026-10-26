# ADR-027. Agent interfaces: a local CLI and a local MCP server, no web API

Status: Accepted. Date: 2026-10-25.

## Context

People now ask AI agents to do work for them: "check my wallets", "which of my addresses are at risk". Before version 1.2.0, an agent could use Bunker only by driving a browser. That is slow, fragile and hard to trust. Bunker must be easy for agents to find and to call, and it must stay private and safe.

## Options

### How an agent calls Bunker

| Option | For | Against |
|---|---|---|
| A. Browser only (an agent drives the page) | No new code | Slow; breaks when the page changes; an agent with a browser has much more power than this task needs |
| B. A web API (`POST /scan`) on a server | Easy for any agent to call | The server receives lists of addresses. Each address is public, but a list linked to one requester shows who owns what. A server needs uptime, abuse limits and logs. It breaks the "sends nothing" promise. |
| C. A remote MCP server (for example on Cloudflare Workers) | Easy to connect to many agents | The same privacy problem as B; it adds authentication and rate-limit work |
| **D. A local CLI with JSON output and a local MCP server over stdio** | No server; nothing leaves the computer; the same engine and tests as the page; works with Claude, Cursor and any MCP client | The agent must run on a computer with Node.js and a copy of the project |

**Chosen: D.** Option C stays open for later, as a separate decision, if users ask for it and accept the privacy trade.

### How agents find Bunker

| Option | For | Against |
|---|---|---|
| A. Nothing special | No work | Agents do not know what Bunker is or how to call it |
| **B. `llms.txt`, `networks.json`, schema.org structured data, a sitemap** | Static files; no server; cheap to keep correct (a test compares them with a fresh build) | Not every agent reads `llms.txt` |
| C. Publish to the MCP Registry now | One-click discovery for MCP clients | Needs a public package (npm or similar) |

**Chosen: B.** C is the next step now that the repository is public.

### How the MCP server is built

| Option | For | Against |
|---|---|---|
| A. The official MCP TypeScript SDK | Full protocol support; less code to write | Adds npm dependencies, which breaks the zero-dependency rule (ADR-003) and its supply-chain protection (ADR-026) |
| **B. About 150 lines of plain JSON-RPC over stdio** | Zero dependencies; easy to audit; only the parts that a read-only tool server needs | Must follow protocol changes by hand |

**Chosen: B.** The server is "dual-era": it speaks the stateless revision 2026-07-28 (`server/discover`, per-request `_meta`, `resultType`, cache hints) and the handshake revisions 2025-11-25 and 2025-06-18. A request that names a version the server does not know gets the `UnsupportedProtocolVersion` error (`-32022`) with the supported list, as the specification requires.

### The output shape

| Option | For | Against |
|---|---|---|
| A. Plain text | Easy for people | Agents must parse prose |
| **B. One JSON report with `schemaVersion`, used by the CLI, the MCP server (`structuredContent` and `outputSchema`) and the tests** | Stable; typed; one place to change | A version rule to follow |

**Chosen: B.** The report also has `planText` for people, and an `attribution` line.

## Security decisions (with the OWASP items)

| Decision | Instead of | Why |
|---|---|---|
| Read-only tools, with `readOnlyHint: true`, `destructiveHint: false`, `openWorldHint: false` | Tools that write files or call explorers | Least privilege. A tool that cannot act cannot be misused (LLM06 Excessive Agency). |
| No network, shell or file-write code in the agent tools; a test checks the imports | Trust in code review alone | A test does not forget (LLM06, LLM03). |
| The secret guard runs before anything else; the secret is never repeated | An error that echoes the input | Error messages must not leak what they block (LLM02 Sensitive Information Disclosure). |
| Labels are cut to 40 characters, cleaned of control and invisible characters, and described as user data | Passing labels through as they are | Labels are the only user text that reaches the agent (LLM01 Prompt Injection, LLM05 Improper Output Handling). |
| Short, plain tool descriptions; a test fails on invisible characters or steering phrases | Long descriptions with instructions to the model | Tool poisoning hides instructions in descriptions (LLM01). |
| Input validation errors come back as tool results with `isError: true` and a structured error, never as protocol errors | JSON-RPC errors for bad arguments | The specification asks for this, so the model can correct itself. Every result conforms to the output schema. |
| Limits: 1 MB message, 500 lines, 100,000 characters | No limits | A large request must not exhaust the host (LLM10 Unbounded Consumption). |
| Every result has a disclaimer and "Educational, not advice" in the server instructions | Results with no context | An agent can present a result as a fact or as advice (LLM09 Misinformation). |
| No dependencies, pinned Node.js | The MCP SDK from npm | Supply chain (LLM03, A03:2025). |

## Consequences

- The CLI and the MCP server are part of the release. `test/agent.test.js` runs them in every check.
- The attribution line travels with every result, so credit spreads with use.
- The repository is public since 2026-10-25, so anyone can clone it and run the tools.
- Next steps: an npm package (so `npx` works), an entry in the MCP Registry, and a one-click Claude Desktop bundle.
