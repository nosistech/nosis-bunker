# ADR-029. Language and theme switches that store nothing

Status: Accepted. Date: 2026-10-25.

## Context

Users asked for a light/dark switch and an English/Spanish switch. Most sites remember these choices. Bunker promises that it stores nothing on the device (ADR-001), and a test fails if the code uses browser storage.

## Options

| Option | For | Against |
|---|---|---|
| A. Save the choice in `localStorage` or a cookie | The choice stays for the next visit | Breaks the "stores nothing" promise; a cookie needs a consent notice in the EU |
| **B. Start from the system settings, keep the choice in memory only** | The promise stays true; most users already have the right system settings | A user who picks a different theme picks it again on the next visit |
| C. Put the choice in the address (`#es`) | A link can open the page in Spanish | Only for the language; it does not help the theme |

## Decision

Option B, with option C for the language.

- **Theme.** The page follows `prefers-color-scheme`. The button sets `data-theme` on the page for this visit only.
- **Language.** The page uses `#es` or `#en` in the address if present. If not, it uses the first language of the browser. The switch updates the address with `#es`, so the user can bookmark or share the Spanish page. A fragment (`#es`) is never sent to the server.

## Consequences

- The switches change nothing that the user typed (WCAG 3.3.7, redundant entry).
- The theme button says what it does ("Switch to dark mode"), not the current state.
- Print always uses the light colors.
