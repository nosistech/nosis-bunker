# ADR-028. English and Spanish, with one engine language

Status: Accepted. Date: 2026-10-25.

## Context

Many users of Bunker speak Spanish (Latin America, Spain, the US). The engine writes about 200 sentences (explanations, plan steps, labels). The page has its own text (headline, buttons, field guide, legal notice).

## Options

| Option | For | Against |
|---|---|---|
| A. English only | Simple | Excludes many users; Spanish speakers use browser translation, which can change the meaning of a security instruction |
| B. Two copies of the page (`/` and `/es/`) | Each page is simple | Two builds, two CSP hashes, two pages to keep the same; a language switch reloads and loses the pasted addresses |
| C. Message keys in the engine (`t('segwit.hidden')`) | Standard i18n | Every detector changes; the English text moves away from the code that it describes, which makes review harder |
| **D. The engine writes English. The page translates what it shows, with a dictionary keyed by the English sentence.** | The engine and its tests do not change; a reviewer sees the English and the Spanish side by side; the switch is instant and keeps the input | The dictionary must follow every English change |

## Decision

Option D.

- `src/i18n/es-sentences.js`: English sentence to Spanish sentence.
- `src/i18n/es-labels.js`: labels, network names, and patterns for text with a variable part (for example "Token contract: USDT on Tron").
- `src/i18n/translate.js`: whole text first, then a pattern, then sentence by sentence.
- Long page text is in `template.html` as paired blocks: `data-lang="en"` and `data-lang="es" lang="es"`.
- Short page labels are in `src/ui/text.js`.

## Controls

`test/i18n.test.js` fails if:

- an English sentence in the engine source has no Spanish,
- a result for any real test address or its typo stays in English,
- any plan advice, for any network, stays in English,
- the two languages do not have the same page keys and paired blocks.

## Consequences

- The Spanish uses "tú", the normal form in modern Latin American products. The same word has the same meaning everywhere ("candado" is the lock, "billetera" is the wallet).
- The CLI and the MCP server use the same translation with `--lang es` and `lang: "es"`.
- The font includes the Spanish letters (P-27).
