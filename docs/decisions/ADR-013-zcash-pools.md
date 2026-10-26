# ADR-013. Rate Zcash shielded funds by pool

Status: Accepted. Date: 2026-10-25.

## Context

A Zcash shielded address does not contain the spend key. The risk comes from the pool that holds the funds. The Zcash developers published their own analysis (the ZIP 2005 quantum-resilience draft). In July 2026, Zcash activated the Ironwood pool (NU6.3). Ironwood supports quantum-recoverable notes. Orchard now only allows withdrawals.

## Options

| Option | For | Against |
|---|---|---|
| A. No rating | No risk of a wrong rating | No help for Zcash holders |
| B. Rate the address like a Bitcoin address | Simple | Wrong model: the address does not hold the key |
| **C. Rate the pool, with the analysis of the Zcash developers** | Correct; gives a clear action | Depends on Zcash research that can change |

## Decision

Option C.

| Address | Model | Plan |
|---|---|---|
| `zs1...` (Sapling) | `move-pool` | Move to Ironwood. Sapling has no quantum recovery path. |
| `u1...` (unified) | `ask-provider`, label "Check your pool" | Find the pool in the wallet. Move Sapling and Orchard funds to Ironwood. |
| `t1`, `t3`, `tex1` (transparent) | `hidden-until-used` | Same rules as Bitcoin. |

## Reasons

- The source is the network's own developers, not our guess.
- The action is clear and available today.

## Consequences

- If Zcash changes its plan, update `src/networks/zcash.js` and this record.
- A unified address can contain more than one receiver. The tool does not decode the receivers, because the funds' pool, not the address, decides the risk.
