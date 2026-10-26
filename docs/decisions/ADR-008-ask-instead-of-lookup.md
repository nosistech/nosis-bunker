# ADR-008. Ask the user instead of a blockchain lookup

Status: Accepted. Date: 2026-10-09.

## Context

For a `hidden-until-used` address, the result depends on one fact: has the address ever sent a transaction or signed a message? A blockchain query can find transactions.

## Options

| Option | For | Against |
|---|---|---|
| A. Automatic lookup through public APIs | No question for the user | Sends the addresses to API providers ([ADR-001](ADR-001-offline-client-only.md)); needs one API for each network; misses off-chain signatures |
| B. Derive all addresses from an xpub and look them up | Covers a whole hardware wallet | Same privacy problem, plus the xpub itself is sensitive |
| **C. Ask the user, with a link to the explorer** | No data leaves the device; the user learns how to examine an address | One click for each address |

## Decision

Option C. The card asks "Has it ever sent a transaction or signed a message?" with three answers: Not sure, No, Yes. An explorer link helps the user find out.

## Reasons

- Privacy comes first.
- Off-chain signatures (permits, "sign in with wallet", NFT listings) also show the key. No blockchain lookup can find them. Only the user knows.

## Consequences

- "Not sure" leads to the plan step "Check or ask".
- A future optional lookup mode must keep the offline mode as the default.
