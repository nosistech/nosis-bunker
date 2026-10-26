# ADR-030. Accessibility: WCAG 2.2 AA, tested, with no overlay

Status: Accepted. Date: 2026-10-25.

## Context

Bunker exists to help people protect their funds. A person who cannot use the page cannot get that help. Many crypto holders use a screen reader, a keyboard only, high zoom, a small phone or a second language. The page must work for all of them, in English and in Spanish.

WCAG (Web Content Accessibility Guidelines) is the shared standard for this work. Version 2.2 is also the international standard ISO/IEC 40500:2025, and the European standard EN 301 549 uses it.

## Options

| Option | For | Against |
|---|---|---|
| A. No target | No work | Some users cannot use the page; problems are found by users, not by us |
| B. An accessibility overlay widget | Fast to add | An overlay does not fix the page itself; it can get in the way of the screen reader that a user already has; it adds a third-party script, which breaks the "loads nothing from outside" promise and which the CSP blocks |
| C. WCAG 2.1 AA | Widely used | Misses the 2.2 criteria that matter for this page (focus not obscured, target size, redundant entry) |
| **D. WCAG 2.2 AA, automated and manual tests, a public statement and a contact** | The current standard; covers 2.1; users know what to expect and how to tell us about a problem | Manual tests take time at each release |

## Decision

Option D.

- Automated: axe-core with the WCAG 2.0, 2.1 and 2.2 A and AA rules, in English and Spanish, light and dark mode, desktop and phone widths.
- Manual and scripted: keyboard only, focus order, 400% zoom and 320-pixel width, text spacing, reduced motion. A screen reader audit is the next step (see Consequences).
- An accessibility statement on the page (Field guide, "Accessibility") with the target, the status, the known limits, the test date and a contact with a 5-working-day answer time.
- Results are recorded in [docs/11-accessibility.md](../11-accessibility.md).

## Consequences

- The statement describes the goal, how we test, the known limits and how to reach us. It makes no claim of conformance, for or against. A full manual audit with several screen readers is the next step.
- axe-core is a test tool only. It is not in the page and not a dependency of the project. The audit loads it in a separate test browser.
