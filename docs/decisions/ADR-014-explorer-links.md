# ADR-014. Show only verified explorer links

Status: Accepted. Date: 2026-10-25.

## Context

An explorer link helps the user answer "Has it ever sent?". Each explorer has its own URL pattern. Patterns change.

## Options

| Option | For | Against |
|---|---|---|
| A. Best guess for every network | A link everywhere | Broken links make the tool look careless; a wrong page can mislead |
| B. No links | Nothing to break | The user must find an explorer alone |
| C. One explorer for all networks (for example Blockchair or Blockscan) | One pattern | No single explorer covers more than 100 networks |
| **D. Links only where the pattern was checked against live explorer pages, plus a weekly automatic check** | Every link works when it ships; broken links are found fast | Some networks have no link |

## Decision

Option D.

## Reasons

- On October 25, 2026, a check of real explorer pages found that the Cosmos links used the wrong path (P-08). Two other links could not be verified (P-09). This proved that guesses are not safe.
- The weekly check (`tools/check-links.js`, `.github/workflows/links.yml`) opens one link for each pattern.

## Consequences

- To add a link: find a real page for a real address, copy the pattern, and add a test address.
- Some networks have no link by design: Monero (private), Silent Payments and MWEB (never on chain), Canton (permissioned).
- Every link has `rel="noopener noreferrer"`, and the page sets `referrer` to `no-referrer`. The explorer does not learn where the user came from.
- Opening a link sends the address to that explorer. The user decides to do this. The page never opens a link alone.
