# ADR-012. Give questions, not ratings, for permissioned networks

Status: Accepted. Date: 2026-10-25.

## Context

Banks and institutions use permissioned networks: Canton, Kinexys (J.P. Morgan), Partior, and the data layer of Quant Fusion. On these networks, the public keys are visible to the network operators, not to the whole internet. Canton party IDs have a public format. Kinexys and Partior have no public addresses at all.

## Options

| Option | For | Against |
|---|---|---|
| A. Rate them as visible | Simple | Wrong: the exposure is limited to the operators |
| B. Ignore them | Simple | No help for institutions, which hold large values |
| **C. Recognize the format, give no rating, and list the questions to ask the provider** | Correct and useful | The user must contact the provider |

## Decision

Option C, with the model `ask-provider`.

## Reasons

- For a permissioned network, the real questions are about the provider. Who can read the keys? Can the keys change? Is there a dated plan to move to post-quantum keys?
- The plan text gives these questions word for word.

## Consequences

- Canton party IDs show "Ask your provider".
- Networks with no public address format (Kinexys, Partior) are listed in [03-networks.md](../03-networks.md#known-limits). They need a review of the provider, not a scanner.
- The questions follow NIST IR 8547 (the plan to retire classic public-key algorithms by 2030 and 2035) and NIST CSWP 39 (crypto agility).
