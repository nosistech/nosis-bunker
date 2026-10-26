# ADR-022. Keep a short list of token contracts

Status: Accepted. Date: 2026-10-25.

## Context

Users often copy a token contract (for example the QNT contract) instead of their wallet address. A contract is a valid address, so the tool rated it as a wallet (P-14).

## Options

| Option | For | Against |
|---|---|---|
| A. No list | No upkeep | The wrong result for a common mistake |
| B. A full token list (thousands of contracts) | Complete | Large file; needs updates; a list that is out of date gives false confidence |
| **C. A short list of the most common contracts** | Small; solves the common mistake | Not complete |

## Decision

Option C. The list is in [src/networks/known-contracts.js](../../src/networks/known-contracts.js): QNT, USDT, USDC, PAXG, XAUT and WBTC on Ethereum, USDT on Tron, and USDC and USDT on Solana.

## Reasons

- These are the most widely held tokens on these networks, and the contracts that people most often paste by mistake.
- The QNT contract was checked on CoinGecko on October 25, 2026. The other contracts are the widely published addresses. Each one was checked against the issuer's documentation or a block explorer on October 25, 2026.

## Consequences

- To add a contract, add one line and add the address to the test fixtures with its source.
- The known-contracts detector runs first in the pipeline ([ADR-006](ADR-006-detector-pipeline.md)).
