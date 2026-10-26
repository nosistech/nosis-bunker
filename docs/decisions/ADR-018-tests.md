# ADR-018. Test with node:test and real addresses

Status: Accepted. Date: 2026-10-25.

## Context

The tool makes claims about more than 100 formats. Each claim needs proof.

## Options

| Option | For | Against |
|---|---|---|
| A. Jest or Vitest | Popular; many features | Adds dependencies ([ADR-003](ADR-003-no-dependencies.md)) |
| B. Manual tests only | No code | Not repeatable; easy to forget a network |
| **C. `node:test` (built into Node.js) with real public addresses** | No dependencies; real data proves real formats | Fewer features than Jest |

## Decision

Option C.

## Reasons

- Real addresses from test vectors and explorer pages prove that the decoders match the real world, not only our own encoder.
- The typo test changes one character of each real address. It found two real problems (P-19, P-20).
- Security rules are also tests ([test/security.test.js](../../test/security.test.js)).

## Consequences

- Every fixture address has a `source`.
- Do not add a private person's address to the fixtures.
- Read [08-testing.md](../08-testing.md) for the full list.
