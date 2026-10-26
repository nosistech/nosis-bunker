# ADR-021. Write the docs with strict house writing rules

Status: Accepted. Date: 2026-10-25.

## Context

The docs must be clear for auditors, for users whose first language is not English, and for translation tools. Early drafts had long sentences and used different words for the same thing (P-22).

## Options

| Option | For | Against |
|---|---|---|
| A. Normal English | Easy to write | Long sentences; many ways to say one thing |
| B. Two languages (English and Spanish) | Reaches more readers | Twice the upkeep; the versions drift apart |
| **C. English with strict rules: short sentences, one word for one meaning, active voice** | Short, clear and easy to translate | Takes more care to write |

## Decision

Option C. The rules are in [WRITING-STYLE.md](../WRITING-STYLE.md).

## Reasons

- In security and money, a wrong reading can be dangerous. Strict rules reduce wrong readings.
- Short sentences and one meaning for each word also make the text easier to audit.
- Simple text translates well with machine translation, so option B stays possible later.

## Consequences

- `tools/check-style.js` fails on em dashes and reports sentences longer than 25 words.
