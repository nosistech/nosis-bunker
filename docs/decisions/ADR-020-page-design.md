# ADR-020. Page design: cards, words and example data

Status: Accepted. Date: 2026-10-09, updated 2026-10-25 (version 1.1.0).

## Context

Most users will open the page on a phone. Many users are not technical. The page must give an answer fast and must not confuse.

## Options

| Topic | Options | Chosen | Why |
|---|---|---|---|
| Results | Table; **one row block for each address** | Row blocks with a status edge | They fit a phone and hold the question and the value field. |
| Status | Color only; icons; **colored label with words** | Words with color | Words work for people with color blindness. |
| First view | Empty page; **example data with a banner** | Example data | The user sees what the tool does before pasting anything. |
| Key words | Technical words; **"lock" metaphor with a glossary** | Metaphor | Easy to remember; one word, one meaning. |
| Plan | Score 0 to 100; **numbered steps in a fixed order** | Steps | Tells the user what to do, in order. |
| Keep the plan | Download; **print**; **copy as text** | Copy and print | Copy works in every viewer. Print gives a PDF. |
| Value | Price lookup; **optional value typed by the user** | Typed value | No network ([ADR-001](ADR-001-offline-client-only.md)). |
| Fonts | Web fonts; system fonts; **one embedded font** | Embedded font | Same look everywhere and no request ([ADR-024](ADR-024-embedded-font.md)). |
| Summary | Number tiles; **sentence and meter** | Sentence and meter | The answer in words, the share at a glance. |
| Layout | One column; **two columns on wide screens** | Two columns | The scanner and the plan stay in view. |

## Decision

The chosen options in the table. Details are in [07-ux-ui.md](../07-ux-ui.md).

## Consequences

- The example addresses are public test addresses. The banner says that they are examples.
- The page has light and dark modes from the same color tokens.
- Nothing scrolls sideways at a width of 320 pixels. This was tested in Chromium.
