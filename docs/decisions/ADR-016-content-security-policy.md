# ADR-016. Use a strict Content Security Policy with hashes

Status: Accepted. Date: 2026-10-25.

## Context

A Content Security Policy (CSP) tells the browser which code may run and which connections the page may open. The page has one inline script and one inline style block ([ADR-004](ADR-004-single-html-file.md)).

## Options

| Option | For | Against |
|---|---|---|
| A. No CSP | Nothing to set up | Injected code runs; the page can connect anywhere |
| B. CSP with `'unsafe-inline'` | Easy with inline code | Allows any inline script, so it does not stop injected code |
| **C. CSP with SHA-256 hashes of the exact script and styles, plus Trusted Types** | Only our exact code runs; all connections are blocked | The hashes change with each build |

## Decision

Option C. The build script computes the hashes ([ADR-005](ADR-005-build-script.md)). The policy is:

```text
default-src 'none';
script-src 'sha256-...';
style-src 'sha256-...';
img-src data:; font-src data:; connect-src 'none'; object-src 'none';
base-uri 'none'; form-action 'none';
require-trusted-types-for 'script'; trusted-types 'none'
```

## Reasons

- `connect-src 'none'` makes the privacy promise a browser rule: the page cannot send data even if a bug tries to.
- `require-trusted-types-for 'script'` makes the browser reject HTML strings in dangerous places such as `innerHTML`. The code does not use them ([ADR-019](ADR-019-safe-dom.md)), and the browser enforces it.
- Hashes need no server. They work from a file on a disk.

## Consequences

- Inline `style="..."` attributes are not allowed. The page uses only classes from the style block.
- Since version 1.1.0, `font-src` and `img-src` allow `data:` URLs only, for the embedded font and the tab icon ([ADR-024](ADR-024-embedded-font.md)). They allow no server. A test fails if the policy names a server.
- `frame-ancestors` does not work in a meta tag. Web hosts must send it as an HTTP header. `tools/site.js` writes them to `site/_headers`. See [docs/security/hosting.md](../security/hosting.md).
- A test proves that the hashes in the policy match the script and the styles.
