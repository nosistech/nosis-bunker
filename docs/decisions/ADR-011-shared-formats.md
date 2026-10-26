# ADR-011. Let the user pick the network for shared formats

Status: Accepted. Date: 2026-10-25.

## Context

Some formats belong to more than one network. `0x` + 64 hex can be Sui, Aptos, IOTA or Starknet. The rule for the key is the same, but the explorer link and the advice are different.

## Options

| Option | For | Against |
|---|---|---|
| A. Guess the most common network | No click | Wrong for many users; wrong explorer link |
| B. Reject the address | Never wrong | No help for the user |
| **C. Show the result and a row of network buttons** | Always correct after one click | One more control on the card |

## Decision

Option C.

## Reasons

- The result (hidden until used) is the same for all four networks. The user gets a correct status before the click.
- The click only changes the network name, the explorer link and the advice.

## Consequences

- Starknet is offered only when the first hex digit is 0 to 7, because Starknet addresses are numbers below 2^251.
- The EVM format is shared by more than 25 networks, but the key and the advice are the same on all of them. The card lists the networks instead of buttons.
