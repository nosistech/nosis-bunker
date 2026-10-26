# ADR-002. Write the tool in JavaScript

Status: Accepted. Date: 2026-10-09.

## Context

The tool must run on any device with no installation ([ADR-001](ADR-001-offline-client-only.md)). Users and auditors must be able to read the code that runs.

## Options

| Option | For | Against |
|---|---|---|
| **A. JavaScript, with type notes in comments (JSDoc and `// @ts-check`)** | Runs in every browser; the code that runs is the code that you read; editors check the types | No compile-time type check in the build |
| B. TypeScript | Strong type checks | Needs a compiler; the browser runs the compiled output, not the source; adds a dependency |
| C. Rust compiled to WebAssembly | Memory safety; speed | The browser runs a binary that is hard to read; heavy toolchain; speed is not a problem here (one address takes less than 1 ms) |
| D. Python or Go | Good for a command-line tool | Cannot run as a plain web page without large runtimes |

## Decision

Option A.

## Reasons

- "View source" shows exactly what runs. This is important for a security tool.
- Type notes in comments give most of the benefit of TypeScript. Editors such as VS Code read them with no compiler.
- The project needs no toolchain beyond Node.js for the tests and the build.

## Consequences

- Each source file starts with `// @ts-check`.
- A future move to TypeScript stays easy, because the types already exist as comments.
