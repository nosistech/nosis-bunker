# ADR-010. Block and clear secrets

Status: Accepted. Date: 2026-10-09.

## Context

Scared users sometimes paste a seed phrase into any tool that says "wallet". Fake "quantum migration" tools ask for exactly this.

## Options

| Option | For | Against |
|---|---|---|
| A. No guard | No false alarms | The tool does nothing to stop a dangerous habit |
| B. Warn, but keep the text | The user can fix a false alarm | The secret stays on screen, in screenshots and in screen recordings |
| **C. Block, clear the input, and explain** | The secret leaves the screen at once; the user learns the rule | A false alarm clears real addresses |

## Decision

Option C. The guard runs before every other step and also when the user pastes text.

## Reasons

- The cost of a false alarm is small: the user pastes again.
- The cost of a missed secret is total loss of funds.
- The message teaches the rule: real tools never ask for a seed phrase.

## Consequences

- The guard must not block real addresses. Address formats that look like keys need special rules (P-04, P-05).
- `test/guard.test.js` tests both directions: the 19 kinds of secrets that must be blocked, the forms that tried to slip past the guard (P-33, P-42), and 8 inputs that look like secrets but must pass, including a list of labeled addresses (P-38).
- The guard never stores or sends the secret. It returns only a short description such as "a seed phrase".
