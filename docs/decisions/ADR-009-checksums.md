# ADR-009. Verify every checksum

Status: Accepted. Date: 2026-10-25.

## Context

Most address formats have a checksum to find typos. A tool that only examines the shape gives a confident result for a wrong address.

## Options

| Option | For | Against |
|---|---|---|
| A. Shape only (regular expressions) | Little code | A typo gets a rating; the user may send funds to a wrong address later |
| B. An external validation service | No code | Sends addresses away ([ADR-001](ADR-001-offline-client-only.md)) |
| **C. Verify each checksum on the device** | Typos show as typos | More code: one decoder for each encoding |

## Decision

Option C, for every format that has a checksum.

## Reasons

- The plan tells people to move funds. A wrong address in the plan is dangerous.
- The typo test found two real gaps (P-19 and P-20). It proves that this rule works.

## Consequences

| Encoding | Checksum | Module |
|---|---|---|
| Base58Check | Double SHA-256 | `core/base58.js` |
| Bech32, Bech32m | BCH code | `core/bech32.js` |
| Blech32 | 12-character BCH code | `core/blech32.js` |
| CashAddr | 40-bit BCH code | `core/cashaddr.js` |
| EIP-55 | Keccak-256 in the capital letters | `networks/evm.js` |
| SS58 | BLAKE2b-512 | `networks/substrate.js` |
| Monero Base58 | Keccak-256 | `core/monero-base58.js` |
| c32check | Double SHA-256 | `core/c32.js` |
| Filecoin | BLAKE2b-32 | `networks/filecoin.js` |
| ICP | CRC-32 | `networks/icp.js` |
| Stellar, TON | CRC-16/XMODEM | `networks/text-accounts.js` |
| Algorand | SHA-512/256 | `networks/text-accounts.js` |
| XRP | Base58Check with the Ripple alphabet | `networks/text-accounts.js` |

Formats with no checksum (Solana, lowercase hex, Lightning node IDs, NEAR names) are listed in [03-networks.md](../03-networks.md#known-limits).
