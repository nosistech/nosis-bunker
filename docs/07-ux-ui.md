# 07. UX and UI

This document gives the design choices for the page. Each choice lists the options. The full record is [ADR-020](decisions/ADR-020-page-design.md).

## Who uses the page

- A crypto holder who read the warning and wants a fast answer.
- A person or team that checks many wallets at once.
- A person who is not technical. The page must not need any crypto knowledge.

## The order of the page

```text
Wide screen (900 pixels and more)            Phone
+------------------+-----------------------+  +---------------------+
| Headline         | Scanner: box, Scan,   |  | Headline, facts     |
| One sentence     | Load example, Clear   |  | Scanner             |
| Three facts      |                       |  | Result sentence     |
+------------------+-----------------------+  | Meter, legend       |
| Result sentence, meter, legend           |  | Address rows        |
+---------------------------+--------------+  | Plan                |
| Address rows              | Plan (stays  |  | Field guide         |
|                           | in view)     |  | Footer              |
+---------------------------+--------------+  +---------------------+
| Field guide: seven sections that open and close                    |
| Footer                                                             |
+--------------------------------------------------------------------+
```

The tool comes first. The explanations come after it, in the field guide. People who know the subject do not have to scroll past text.

## Choices

### 1. Cards or a table for the results

| Option | For | Against |
|---|---|---|
| A. Table | Compact on a desktop | Does not fit on a phone; no space for questions |
| **B. One card for each address** | Works on a phone; each card holds its question and its value field | Takes more height |

**Chosen: B.** Most users open the page on a phone. Each card needs controls (the question, the network picker, the value).

### 2. How to show the status

| Option | For | Against |
|---|---|---|
| A. Color only | Clean | People with color blindness cannot read it |
| B. Icons only | Small | Icons need a legend |
| **C. Colored label with words** ("Lock visible") | Clear for everyone | Uses more space |

**Chosen: C.** The color supports the words. The words carry the meaning. Red means visible, amber means "check", green means hidden.

### 3. The first view

| Option | For | Against |
|---|---|---|
| A. Empty page with a box | Clean | Shows nothing; the user does not know what to expect |
| **B. Example addresses already scanned** | Shows the result at once | The user must know the data is an example |

**Chosen: B**, with a blue banner: "These are public example addresses with example values." The examples are public test addresses, not a real person's wallet.

### 4. Words for the key

| Option | For | Against |
|---|---|---|
| A. Technical words only ("public key exposed") | Exact | Many users do not understand |
| **B. A metaphor ("lock") and a glossary** | Easy to remember | Needs a definition |

**Chosen: B.** "Lock" always means "public key". The glossary at the bottom defines it. The same word has the same meaning everywhere (a house writing rule).

### 5. How to give the plan

| Option | For | Against |
|---|---|---|
| A. A score from 0 to 100 | Short | Hides the reason; a number feels exact when it is not |
| **B. Numbered groups of steps in a fixed order** | Tells the user what to do, in order | Longer |

**Chosen: B.** Ground rules always come first. The highest value comes first in each group.

### 6. How to keep the plan

| Option | For | Against |
|---|---|---|
| A. Download a file | A real file | Some viewers block downloads |
| **B. Copy as plain text** | Works everywhere; the user pastes it into notes or an email | No formatting |
| **C. Print** | Familiar; "Save as PDF" in every browser | Not available in all viewers |

**Chosen: B and C.** If the clipboard is blocked, the page shows the text and selects it. The print layout shows only the results and the plan.

### 7. Shared address formats

Some addresses can belong to more than one network. For example, `0x` + 64 hex can be Sui, Aptos, IOTA or Starknet. The card then shows a row of buttons, and the user selects the network. See [ADR-011](decisions/ADR-011-shared-formats.md).

### 8. Value field

The value is optional. The tool does not look up prices. The user types a value, and the plan puts the largest values first. Values stay in the page memory. The page does not save them.

### 9. The result summary

| Option | For | Against |
|---|---|---|
| A. Three number tiles | Common | Looks like every dashboard; the reader must add the numbers |
| **B. One sentence, then a meter with one segment for each address** | The answer in words; the meter shows the share at a glance | The sentence must change with the data |

**Chosen: B.** Example: "4 of 5 addresses show their lock. $12,450 sits behind a visible lock." The meter is the one bold element of the page. It fills once after each scan.

### 10. Where the plan goes

| Option | For | Against |
|---|---|---|
| A. Below all the results | Simple | On a wide screen, the reader does not see the plan change |
| **B. Next to the results on a wide screen; it stays in view. Below on a phone.** | Each answer updates the plan in view | Two layouts to test |

**Chosen: B.**

### 11. Reference text

| Option | For | Against |
|---|---|---|
| A. All sections open, one after the other | Easy to search with Ctrl + F | A long page |
| B. Tabs | Compact | Needs script and arrow-key support; hides text from print |
| **C. Native `details` sections ("field guide")** | Short page; works with no script; keyboard support is built in | One click to open |

**Chosen: C.** The first section ("Where things stand") is open.

### 12. Language switch

| Option | For | Against |
|---|---|---|
| A. A drop-down list of languages | Scales to many languages | Two languages do not need a list; one more click |
| B. A flag icon | Familiar | A flag is a country, not a language; Spanish has more than 20 countries |
| **C. A globe icon with two buttons, EN and ES, the current one filled** | One click; the state is visible; works with a keyboard and a screen reader (`aria-pressed`) | Takes a little more space |

**Chosen: C.** The switch keeps everything that the user typed. Details: [ADR-028](decisions/ADR-028-two-languages.md) and [ADR-029](decisions/ADR-029-preferences-without-storage.md).

### 13. Theme switch

| Option | For | Against |
|---|---|---|
| A. No switch; follow the system | No code | Users asked for it; some want dark mode on a light system |
| B. Three states: system, light, dark | Complete | Harder to understand with one button |
| **C. One button that switches to the other theme, with a sun or moon icon** | Simple; the label says what happens ("Switch to dark mode") | The choice is not saved (ADR-029) |

**Chosen: C.**

## Visual design

- **Palette.** Gray tones like poured concrete, one cobalt blue for actions, and three status colors (red, amber, green). Light and dark modes follow the system setting.
- **Type.** Archivo, embedded ([ADR-024](decisions/ADR-024-embedded-font.md)). Headings use the wide, heavy cut. Body text uses the normal cut. Addresses use the system monospace font. Labels use sentence case.
- **Status.** Each row has a colored edge, an icon (open lock, closed lock, question mark) and words. The color is never the only signal.
- **Header.** The Bunker wordmark on the left. The language switch, the theme button and "by NosisTech" on the right.
- **Layout.** Up to 1200 pixels wide. Two columns from 900 pixels. 16 pixels of space at the sides. Nothing scrolls sideways on a phone.
- **Motion.** One motion only: the meter fills after a scan. It does not play if the user turns on "reduce motion".

## Accessibility

- Every button has a visible text label.
- The status is in words, not only in color.
- The question buttons use `aria-pressed`.
- The alert uses `role="alert"`. Screen readers announce it.
- Keyboard focus has a visible outline.
- A "Skip to the scanner" link is the first item for keyboard users.
- After an answer, focus stays on the same button (P-25).
- Ctrl + Enter (or Cmd + Enter) in the box starts a scan.
- After a scan, the page scrolls to the results only if they are below the screen.
- The full audit and its results are in [11-accessibility.md](11-accessibility.md).
- The color pairs have strong contrast in both color modes. The audit results are in [11-accessibility.md](11-accessibility.md).
