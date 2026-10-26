# OWASP mapping

This document maps the security controls of Bunker to OWASP guidance. Each control has a place in the code and a test where possible.

The page has no server, no login, no session, no file upload and no API. Many OWASP chapters do not apply. This document says so for each one.

## OWASP Top 10:2025

| Category | Applies? | Control in Bunker | Proof |
|---|---|---|---|
| A01 Broken Access Control | No server, no accounts | Not applicable | |
| A02 Security Misconfiguration | Yes | Strict CSP in the page; security headers for hosting in `site/_headers` and `deploy/Caddyfile` | `test/security.test.js` (CSP test) |
| A03 Software Supply Chain Failures | Yes | Zero dependencies; `ignore-scripts`; no third-party CI actions; Node.js version gate; pinned Node.js build with hash check in CI; pinned font hash; reproducible build; SHA-256 of the page published. See [supply-chain.md](supply-chain.md). | `test/supply-chain.test.js`, `.github/workflows/ci.yml` |
| A04 Cryptographic Failures | Partly | The tool only verifies checksums of public data. It never signs, encrypts or handles keys. Hash code is tested against references. | `test/core.test.js` |
| A05 Injection | Yes (DOM XSS) | No `innerHTML` or `eval`; DOM methods and `textContent` only; Trusted Types; https-only links | `test/security.test.js` (DOM sink test), Chromium XSS test |
| A06 Insecure Design | Yes | Offline by design; secret guard; no data storage | ADR-001, ADR-010 |
| A07 Authentication Failures | No accounts | Not applicable | |
| A08 Software or Data Integrity Failures | Yes | CSP script and style hashes in the page and in the HTTP header; `no-transform`; CI compares the committed page and website with a fresh build | Build test, CI step |
| A09 Security Logging and Alerting Failures | Limited | No server, so no logs. The page logs nothing, by design, to protect privacy. | |
| A10 Mishandling of Exceptional Conditions | Yes | Each address is classified inside `try`/`catch`. One bad line cannot break the page. Input limits stop very large input. | `src/parse.js`, `test/guard.test.js` (limits) |

## OWASP ASVS 5.0

| Chapter | Applies? | Control | Where |
|---|---|---|---|
| V1 Encoding and Sanitization | Yes | All user text goes into the page with `textContent`. Explorer links encode the address with `encodeURIComponent`. | `src/ui/app.js`, `src/explorer.js` |
| V2 Validation and Business Logic | Yes | Input limits: 100,000 characters, 500 lines, 4,000 characters per address, 40 characters per label, value below 10^15. Checksum validation for each format. | `src/parse.js`, `src/classify.js`, `src/networks/` |
| V3 Web Frontend Security | Yes | CSP with hashes; Trusted Types; `referrer` set to `no-referrer`; `rel="noopener noreferrer"` on links; no inline event handlers; no inline styles. Hosting headers add `frame-ancestors 'none'`, `X-Content-Type-Options` and HSTS. | `tools/build.js`, `src/ui/template.html`, `site/_headers` |
| V4 API and Web Service | No API | Not applicable | |
| V5 File Handling | No uploads | Not applicable | |
| V6 to V10 Authentication, Sessions, Authorization, Tokens, OAuth | No accounts | Not applicable | |
| V11 Cryptography | Partly | Hashes are used only for checksums of public data. They are not used for secrets. | ADR-003 |
| V12 Secure Communication | No connections | `connect-src 'none'` blocks all connections. Hosting must use HTTPS with HSTS. | CSP, `site/_headers` |
| V13 Configuration | Yes | No secrets in the repository. No debug mode. Reproducible build. | CI |
| V14 Data Protection | Yes | No storage (`localStorage`, cookies, IndexedDB). No analytics. Values stay in page memory only. | `test/security.test.js` (storage test) |
| V15 Secure Coding and Architecture | Yes | Small modules; zero dependencies; layered design; frozen result objects | `docs/04-architecture.md` |
| V16 Security Logging and Error Handling | Limited | Errors in one line show "could not read this line". No stack traces on screen. | `src/parse.js` |
| V17 WebRTC | No | Not applicable | |

## OWASP Cheat Sheets that we follow

| Cheat sheet | What we took from it |
|---|---|
| DOM-based XSS Prevention | Use `textContent`; never put user text into HTML strings; avoid dangerous sinks. |
| Content Security Policy | Use `default-src 'none'`, hashes instead of `'unsafe-inline'`, and `base-uri` and `form-action` limits. |
| HTML5 Security | No storage of sensitive data in the browser; `noopener` on new windows. |
| HTTP Headers | `X-Content-Type-Options`, `Referrer-Policy`, `Strict-Transport-Security`, `Permissions-Policy`. |
| Input Validation | Allow-list formats; length limits; reject what does not match. |
| Third Party JavaScript Management | Load no third-party JavaScript. |

## OWASP Top 10 CI/CD Security Risks

| Risk | Control |
|---|---|
| Dependency chain abuse | No dependencies. |
| Poisoned pipeline execution | No third-party actions; read-only token; no secrets in CI. |
| Insufficient credential hygiene | The workflow uses only the default token with `contents: read`. |
| Improper artifact integrity validation | CI fails if `dist/` differs from a fresh build. Users verify the SHA-256 hash. |

## What we test in a browser

On October 25, 2026, the built page was tested in Chromium (headless shell):

- No console errors and no CSP violations.
- The label `<img src=x onerror=alert(1)>` showed as text. No image was made.
- A pasted seed phrase was cleared, and the alert showed.
- Explorer links had `rel="noopener noreferrer"` and an `https://` address.
- No horizontal scroll at a width of 320 pixels.

## OWASP guidance for AI agents and MCP

Bunker 1.2.0 adds a CLI and an MCP server for AI agents. The decisions are in [ADR-027](../decisions/ADR-027-agent-interfaces.md). This table maps them to the OWASP Top 10 for LLM Applications (2025).

| Item | Applies? | Control in Bunker | Proof |
|---|---|---|---|
| LLM01 Prompt Injection | Yes (labels, tool descriptions) | Labels cut to 40 characters and cleaned; described as user data; plain tool descriptions with no hidden text | `test/agent.test.js` |
| LLM02 Sensitive Information Disclosure | Yes | The secret guard runs first; secrets are never repeated in output or logs; stderr logs never print input | `test/agent.test.js` |
| LLM03 Supply Chain | Yes | No dependencies; no MCP SDK; pinned Node.js; source only from this repository | `test/supply-chain.test.js` |
| LLM04 Data and Model Poisoning | No model | Not applicable | |
| LLM05 Improper Output Handling | Yes | Output is JSON with a fixed schema; explorer links are https only; no HTML in output | `outputSchema`, `test/plan.test.js` |
| LLM06 Excessive Agency | Yes | Read-only tools; no network, shell or file writes; hints `readOnlyHint` and `openWorldHint: false` | `test/agent.test.js` |
| LLM07 System Prompt Leakage | No prompts | The server has no hidden prompt. The `instructions` text is public. | `mcp/tools.js` |
| LLM08 Vector and Embedding Weaknesses | No embeddings | Not applicable | |
| LLM09 Misinformation | Yes | Disclaimer in every report; "educational, not advice" in the server instructions; `status: unknown` for anything not rated | `src/agent/report.js` |
| LLM10 Unbounded Consumption | Yes | 1 MB message, 500 lines, 100,000 characters | `mcp/server.js`, `test/agent.test.js` |
