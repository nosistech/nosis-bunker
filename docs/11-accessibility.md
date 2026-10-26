# 11. Accessibility

Bunker targets the Web Content Accessibility Guidelines (WCAG) 2.2 at Level AA. The decision and the options are in [ADR-030](decisions/ADR-030-accessibility.md). This document records how we test and what we found.

## Where we are

The automated audit has no violations. The manual checks below pass. The next step is a full manual audit with several screen readers (NVDA, VoiceOver, TalkBack).

## Audit of October 25, 2026 (versions 1.2.0 and 1.2.1)

### Automated: axe-core 4.14.0

Rules: WCAG 2.0, 2.1 and 2.2, levels A and AA, plus best practices. All sections of the field guide open.

| Language | Theme | Width | Violations | Passed rules |
|---|---|---|---|---|
| English | Light | 1280 px | 0 | 50 |
| English | Dark | 1280 px | 0 | 50 |
| Spanish | Light | 390 px | 0 | 49 |
| Spanish | Dark | 390 px | 0 | 49 |

### Manual and scripted checks

| WCAG criterion | Check | Result |
|---|---|---|
| 2.1.1 Keyboard, 2.1.2 No keyboard trap | Complete the flow with Tab, Shift+Tab, Enter and Space | Pass |
| 2.4.1 Bypass blocks | "Skip to the scanner" is the first item | Pass |
| 2.4.3 Focus order | Skip link, EN, ES, theme, NosisTech, address box, Scan, Load example, Clear | Pass |
| 2.4.7 Focus visible, 2.4.11 Focus not obscured | A 2-pixel outline on every control; no sticky element covers it | Pass |
| 1.4.3 and 1.4.11 Contrast | axe in both themes; field borders use a 3:1 color (P-29) | Pass |
| 1.4.10 Reflow | 320-pixel width: no sideways scroll, in both languages | Pass |
| 1.4.12 Text spacing | Line height 1.5, letter spacing 0.12 em, word spacing 0.16 em: no sideways scroll, no cut text | Pass |
| 2.5.8 Target size | Every button and link is at least 24 by 24 pixels (P-29) | Pass |
| 2.3.3 Animation from interactions | With "reduce motion", the meter does not animate | Pass |
| 3.1.1 Language of page, 3.1.2 Language of parts | `html lang` changes with the switch; Spanish blocks have `lang="es"`; the ES button has `lang="es"` | Pass |
| 3.3.7 Redundant entry | The language and theme switches keep the pasted addresses | Pass |
| 4.1.3 Status messages | The result sentence and "The plan is copied" use `role="status"`; the secret alert uses `role="alert"` | Pass |
| 2.5.3 Label in name | Buttons with short visible text include it in the name ("EN, English") | Pass |

### Known limits

- Screen readers read long addresses one character at a time. This is the nature of an address. The plan is also available as plain text (Copy plan) and as the CLI output.
- The checks above used Chromium. Firefox and Safari checks are open work.

## How to run the audit

The audit is a manual release step, so the project keeps zero dependencies.

1. Install Playwright with Chromium on your computer.
2. In a separate folder, run `npm install axe-core`.
3. In the project folder, run:

   ```text
   node audit/a11y-audit.cjs dist/nosis-bunker.html <folder>/node_modules/axe-core/axe.min.js
   ```

4. The last line must say `axe: clean`. Copy the table into this document with the date and the version.

## Rules for every change

- Do not add an accessibility overlay widget.
- Every control has a visible label, or an `aria-label` that contains its visible text.
- Text has a contrast of 4.5:1. Borders that show a field have 3:1.
- Do not use color alone. Each status has words and an icon.
- New text needs English and Spanish (ADR-028).
- The public statement describes the goal, the tests and the contact. It makes no claim of conformance.
