# ADR-017. Use BigInt for 64-bit math

Status: Accepted. Date: 2026-10-25.

## Context

Keccak-256, BLAKE2b and SHA-512 use 64-bit words. JavaScript numbers are exact only up to 53 bits.

## Options

| Option | For | Against |
|---|---|---|
| A. Two 32-bit numbers for each 64-bit word | Fast | Code is two or three times longer; carries and rotations are easy to get wrong |
| **B. BigInt** | Code follows the specification line by line | About 10 to 50 times slower than option A |
| C. WebAssembly | Fastest | A binary is hard to audit; needs a toolchain ([ADR-002](ADR-002-language.md)) |

## Decision

Option B.

## Reasons

- The tool hashes a few hundred bytes for each address. Even slow code takes less than one millisecond.
- Code that reads like the specification is easier to audit. Auditability matters more than speed here.

## Consequences

- The tool needs a browser with BigInt support (all major browsers since 2020).
- Shared 64-bit helpers are in `src/core/u64.js`.
