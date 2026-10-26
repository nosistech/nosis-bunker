# ADR-006. Organize networks as an ordered detector pipeline

Status: Accepted. Date: 2026-10-25.

## Context

The prototype had one function of about 200 lines with a long chain of `if` statements. Each new network made it longer. A change in one place could break another network.

## Options

| Option | For | Against |
|---|---|---|
| A. One large function (the prototype) | Everything in one place | Hard to read and test; changes have side effects |
| B. A table of regular expressions | Short | A regular expression cannot verify a checksum; order problems stay hidden |
| C. Plugins that load at run time | Flexible | Dynamic loading is a security risk; more code |
| **D. A fixed, ordered list of small detectors** | Each detector is small and tested; the order is visible in one file | The order must be correct |

## Decision

Option D. Each family of formats has one detector in `src/networks/`. The list in `src/networks/index.js` sets the order.

## Reasons

- One detector, one job. A detector returns a result or `null`.
- The order is explicit. Each line in `index.js` has a comment that gives the reason for its position.
- A test (`each detector answers for the expected inputs`) proves the order for important cases.

## Consequences

- To add a network, add a rule to an existing detector or add one detector and one line.
- Detectors must not depend on each other, except through shared helpers in `src/core/`.
