# ADR-007. Use named exposure models

Status: Accepted. Date: 2026-10-09, extended 2026-10-25.

## Context

Each address needs a result. Networks expose keys in different ways. Some show the key from day one. Some hide it until the first send. Some depend on a pool or an operator.

## Options

| Option | For | Against |
|---|---|---|
| A. Yes or no ("safe" or "not safe") | Very simple | Wrong: "hidden until used" is neither; it depends on the user's history |
| B. A score from 0 to 100 | One number | Looks exact when it is not; hides the reason; users argue about the number |
| **C. A small set of named models, plus the user's answer** | Each model has a clear rule and a clear action | More categories to explain |

## Decision

Option C. The models are in [src/model.js](../../src/model.js):

| Model | Example | Status |
|---|---|---|
| `visible` | Taproot, Solana, Monero | Lock visible |
| `hidden-until-used` | `bc1q`, EVM, Cosmos | Depends on the answer |
| `hash-safe` | BIP-360 (`bc1z`) | Hash-protected |
| `move-pool` | Zcash Sapling | Lock visible, with a pool to move to |
| `ask-provider` | Canton, Zcash unified | Check needed |
| `xpub` | Extended public keys | Shows every key |
| `unknown` | Typos, contracts, test networks | Not rated |

## Reasons

- Each model maps to one action in the plan. The plan stays logical.
- A model describes the network, not the person. The person's history (the "sent" answer) is a separate input.

## Consequences

- A new kind of network may need a new model. Add it to `MODEL`, to `statusOf()`, to `buildPlan()` and to this table.
- `move-pool` and `ask-provider` were added for Zcash and Canton (see [ADR-012](ADR-012-permissioned-networks.md) and [ADR-013](ADR-013-zcash-pools.md)).
