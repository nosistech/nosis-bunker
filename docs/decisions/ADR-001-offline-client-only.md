# ADR-001. Run everything on the user's device

Status: Accepted. Date: 2026-10-09.

## Context

The tool reads crypto addresses. A list of addresses tells a lot about a person: how much they hold and where. If the tool sends the list to a server, the server owner learns this. An attacker who breaks into the server also learns it.

## Options

| Option | For | Against |
|---|---|---|
| A. Server API: the page sends addresses to our server, and the server examines them | Automatic balance and history lookups; easy updates | The server sees every list; we must protect a database; legal duties for personal data |
| B. Page calls public blockchain APIs from the browser | Automatic lookups; no server of our own | Each API provider sees the addresses and the user's IP address; providers change or block access |
| **C. Everything on the user's device** | Nothing leaves the device; works with no internet; nothing to attack on our side | No automatic lookups; the user answers one question for each address |

## Decision

Option C.

## Reasons

- The tool exists because people are afraid of losing funds. It must not create a new privacy risk.
- A tool that works offline is easy to verify: turn on airplane mode, and it still works.
- With no server, there is no database to protect and no personal data to store.

## Consequences

- The user must answer "Has it ever sent?" ([ADR-008](ADR-008-ask-instead-of-lookup.md)).
- The page must block all network connections ([ADR-016](ADR-016-content-security-policy.md)).
- A future version with automatic lookups must be a separate, optional mode with a clear warning.
