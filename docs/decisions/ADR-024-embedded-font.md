# ADR-024. Embed one open-license font in the page

Status: Accepted. Date: 2026-10-25. Replaces [ADR-015](ADR-015-system-fonts.md).

## Context

The page moved to a public website, https://bunker.nosistech.com. It must look the same and look professional on Windows, macOS, Android and iOS. System fonts look different on each one. The privacy promise stays: the page makes no request.

## Options

| Option | For | Against |
|---|---|---|
| A. System fonts (ADR-015) | No bytes added; no license work | The look changes between devices; the headings had no strong identity |
| B. A font from a font service | Easy | A request on every visit; breaks the privacy promise; blocked by the CSP |
| C. Several font files embedded | Many styles | 150 KB or more |
| **D. One variable font, subset to Latin, embedded as a data URL** | Same look everywhere; no request; one file covers all weights and widths | Adds about 100 KB as base64; the font file is outside code |

## Decision

Option D. The font is **Archivo** (SIL Open Font License 1.1). It has a weight axis (100 to 900) and a width axis (62% to 125%). The wide, heavy cut gives the headings a vault-door look. The normal cut is easy to read in body text.

## Controls

- The CSP allows fonts only from `data:` URLs. A test fails if the CSP names a server.
- The build checks the SHA-256 hash of the font file before it embeds it. A changed font file stops the build.
- The font is in the style block, so the CSP style hash also covers the font bytes.
- The license file is next to the font: `src/ui/fonts/OFL.txt`.

## How the font file was made

1. Source: the Archivo variable font in the Google Fonts repository on GitHub (`ofl/archivo`).
2. Subset with fontTools `pyftsubset`: Basic Latin, Latin-1 Supplement (for Spanish: á, é, í, ó, ú, ñ, ¿, ¡), common punctuation, the features `kern`, `liga`, `tnum`, `case` and `ss01`. Output: WOFF2.
3. SHA-256 of the result: `7338cf2748ef1408457b9278edcfc12e8de800b5e0546423eb8705510286cd35` (74 KB).

To change the font, repeat these steps and change `FONT_SHA256` in `tools/build.js`.

## Consequences

- The page is about 300 KB. It still opens at once from a disk.
- Addresses still use the system monospace font, so each character is easy to compare.
