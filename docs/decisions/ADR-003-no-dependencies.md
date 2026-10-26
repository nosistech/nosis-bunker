# ADR-003. Use no third-party libraries

Status: Accepted. Date: 2026-10-25.

## Context

The tool needs many checksum functions: SHA-256, SHA-512/256, Keccak-256, BLAKE2b, CRC-32, CRC-16 and several encodings. Libraries for these exist.

## Options

| Option | For | Against |
|---|---|---|
| A. npm libraries (for example `@noble/hashes`, `bitcoinjs-lib`, `@polkadot/util`) | Well tested; less code to write | Supply-chain risk: a compromised package can steal data; many packages pull more packages; larger page |
| B. The browser WebCrypto API | Built in; fast | Asynchronous; has SHA-256 and SHA-512 but no Keccak, BLAKE2b or SHA-512/256 |
| **C. Our own small functions, tested against reference values** | No supply chain; small; every line is in this repository | We must write and test them |

## Decision

Option C.

## Reasons

- Supply-chain attacks are a top risk in OWASP Top 10 (2025). With zero dependencies, there is no package to compromise.
- The functions are short (15 to 97 lines each) and easy to audit.
- The tests compare each function with Node's own crypto library or with published test values. See [08-testing.md](../08-testing.md).
- The functions only check public data (addresses). They never handle secrets, so side-channel attacks do not apply.

## Consequences

- `package.json` has no `dependencies` and no `devDependencies`.
- A new algorithm needs a new core module and a test against a reference.
- Important: these functions are for checksums of public data only. Do not use them to sign or encrypt.
