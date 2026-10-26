# ADR-005. Use a small build script of our own

Status: Accepted. Date: 2026-10-25.

## Context

The source code is many small modules ([ADR-006](ADR-006-detector-pipeline.md)). The delivery is one HTML file ([ADR-004](ADR-004-single-html-file.md)). Something must join the modules.

## Options

| Option | For | Against |
|---|---|---|
| A. A standard bundler (esbuild, Rollup, Vite) | Handles all module syntax; widely used | Adds dependencies and their supply chain; output is harder to read |
| B. Native ES modules in the browser, no build | No build step | Browsers block module imports from `file://`; many files to verify |
| C. Join the files by hand | No tool | Mistakes; not repeatable |
| **D. Our own script (`tools/build.js`, about 190 lines, Node built-ins only)** | No dependencies; readable output; strict rules; repeatable | Supports only a small part of module syntax |

## Decision

Option D.

## Reasons

- The project has zero dependencies ([ADR-003](ADR-003-no-dependencies.md)). A bundler would break that rule.
- The script also does security work: it computes the Content Security Policy hashes ([ADR-016](ADR-016-content-security-policy.md)).
- The script stops on any risk that it can find: unsupported syntax, dynamic `import()`, duplicate top-level names, or `</script>` inside the code.
- The output keeps the comments and the module names, so a reader of the built file can find each part in the source.

## Consequences

- Modules must follow the syntax rules in [04-architecture.md](../04-architecture.md#module-syntax-rules).
- Top-level names must be unique across all modules. Helpers in the page use the prefix `ui`.
- The build gives the same file every time. A test proves this, and CI compares the committed file with a fresh build.
