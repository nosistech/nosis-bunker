# ADR-019. Build the page with DOM methods only

Status: Accepted. Date: 2026-10-25.

## Context

The page shows text that the user typed: addresses and labels. If the page puts that text into HTML strings, a label such as `<img src=x onerror=alert(1)>` can run code. This is cross-site scripting (XSS). The prototype used `innerHTML` with an escape function (P-18).

## Options

| Option | For | Against |
|---|---|---|
| A. `innerHTML` with an escape function | Short code | One missed escape is a security hole; hard to audit |
| B. A framework (React, Vue, Svelte) | Escapes text by default | Adds dependencies and a build step; much more code to audit |
| **C. `document.createElement` and `textContent` only** | Text is always text; no HTML parser runs on user input | A little more code |

## Decision

Option C. One helper, `uiEl(tag, attrs, children)` in [src/ui/app.js](../../src/ui/app.js), builds every element. Text goes through `textContent`.

## Reasons

- This follows the OWASP DOM-based XSS Prevention Cheat Sheet: use safe sinks such as `textContent`.
- With Trusted Types in the CSP ([ADR-016](ADR-016-content-security-policy.md)), the browser also rejects HTML strings in dangerous sinks.

## Consequences

- `test/security.test.js` fails if the built code contains `innerHTML`, `outerHTML`, `insertAdjacentHTML`, `document.write`, `eval`, `new Function` or a string timer.
- Links come only from `explorerUrl()`, which returns `https:` URLs or nothing. A `javascript:` URL cannot get into the page.
- In a Chromium test, the label `<img src=x onerror=alert(1)>` showed as plain text and made no image.
