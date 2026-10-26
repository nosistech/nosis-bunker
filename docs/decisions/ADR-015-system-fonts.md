# ADR-015. Use system fonts

Status: Replaced by [ADR-024](ADR-024-embedded-font.md). Date: 2026-10-25.

## Context

The first page loaded fonts from Google Fonts. The page also said "nothing leaves your device". A font request sends the user's IP address and the page address to Google (P-12).

## Options

| Option | For | Against |
|---|---|---|
| A. Google Fonts | Many typefaces; easy | Third-party request on every visit; breaks the privacy promise; blocked by the CSP |
| B. Font files embedded in the HTML | Exact look; no requests | Adds 100 to 300 KB; license work for each font |
| **C. System fonts** | No requests; fast; familiar for each user | The look changes a little between Windows, macOS, Android and iOS |

## Decision

Option C.

## Reasons

- The privacy promise must be literally true.
- The Content Security Policy sets `font-src 'none'`. The page cannot load a font even by mistake.

## Consequences

- The title uses a stack of narrow system fonts (Avenir Next Condensed, Roboto Condensed, Arial Narrow) with a bold weight.
- Body text uses `system-ui`. Code and addresses use `ui-monospace`.
