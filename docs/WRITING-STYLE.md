# Writing style

The documentation of this project follows the house writing rules on this page. The rules make the text clear for auditors, for readers whose first language is not English, and for translation tools.

## Scope

- **All procedures and descriptions** follow the rules. This is about 80% of the text.
- **Decision records and problem reports** follow the same rules where possible. Some parts need technical names, such as "Bech32m" or "Content Security Policy". We keep these names and define them in the [glossary](09-glossary.md).
- **Code comments** follow the same rules.

## The rules that we use

### Words

1. Use one word for one meaning. In this project, "lock" always means "public key".
2. Use the same word every time. Do not change words for variety.
3. Use the articles "the", "a" and "an".
4. Do not use slang or idioms.
5. Define technical names in the glossary.

### Sentences

1. Write procedural sentences with 20 words or fewer.
2. Write descriptive sentences with 25 words or fewer.
3. Write one instruction in each sentence.
4. Use the active voice. Write "The guard clears the input", not "The input is cleared".
5. Use the imperative for instructions. Write "Type `npm test`", not "You should type `npm test`".
6. Put a warning before the step that it is about.

### Paragraphs

1. Write one topic in each paragraph.
2. Write six sentences or fewer in each paragraph.
3. Use lists for steps. Use tables for comparisons.

### House rules

1. Do not use em dashes. Use a period, a comma or a colon.
2. Do not use phrases that only add drama, such as "Not X. Y." or "Here is the thing".
3. Give an example after each new idea.

## Examples

| Not this | This |
|---|---|
| The input is then cleared by the guard, which also displays a warning. | The guard clears the input. Then it shows a warning. |
| You might want to consider moving your funds at some point. | Move your funds to a new address. |
| Not uncrackable. Uncracked. | Nobody has found a solution. Nobody has proved that there is no solution. |
| Leverage the checksum to validate inputs. | Use the checksum to find typos. |

## Check

`node tools/check-style.js` fails if a Markdown file contains an em dash. It also lists sentences with more than 25 words. Fix them where you can. Some sentences must stay long because they contain lists of network names.
