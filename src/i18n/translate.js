// @ts-check
// Translate engine text to Spanish. The engine always writes English. The page translates
// only what it shows, so the engine, the tests and the CLI stay simple.
// Method: 1. the whole text as a label or sentence; 2. a pattern; 3. sentence by sentence.
// Text with no translation stays in English. test/i18n.test.js makes sure that this does not happen.
import { ES_SENTENCES } from './es-sentences.js';
import { ES_LABELS, ES_PATTERNS } from './es-labels.js';

/**
 * A label, or null. Patterns are not tried here, so a nested part cannot start a second pattern.
 * @param {string} s
 * @returns {string | null}
 */
function esLabel(s) {
  return Object.prototype.hasOwnProperty.call(ES_LABELS, s) ? ES_LABELS[/** @type {keyof typeof ES_LABELS} */ (s)] : null;
}

/**
 * One label or one sentence, or null if there is no translation.
 * @param {string} s
 * @returns {string | null}
 */
function esOne(s) {
  if (Object.prototype.hasOwnProperty.call(ES_SENTENCES, s)) return ES_SENTENCES[/** @type {keyof typeof ES_SENTENCES} */ (s)];
  const label = esLabel(s);
  if (label !== null) return label;
  for (const [pattern, template] of ES_PATTERNS) {
    const m = pattern.exec(s);
    if (!m) continue;
    return template.replace(/\{(\d)\}|\$(\d)/g, (_, nested, plain) => {
      if (plain) return m[Number(plain)];
      const part = m[Number(nested)];
      const inner = esLabel(part);
      return inner === null ? part : inner;
    });
  }
  return null;
}

/**
 * Split text into sentences: after a period that is followed by a space and a capital letter or a quote.
 * Written without a lookbehind, which older Safari versions do not support.
 * @param {string} text
 * @returns {string[]}
 */
function sentences(text) {
  const out = [];
  let start = 0;
  const re = /\.\s+(?=[A-Z"])/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    out.push(text.slice(start, m.index + 1));
    start = m.index + m[0].length;
  }
  out.push(text.slice(start));
  return out.filter(Boolean);
}

/**
 * Translate English engine text to Spanish.
 * @param {string} text
 * @returns {string}
 */
export function toSpanish(text) {
  if (!text) return text;
  const whole = esOne(text.trim());
  if (whole !== null) return whole;
  return sentences(text.trim()).map(s => {
    const t = esOne(s);
    return t === null ? s : t;
  }).join(' ');
}

/**
 * The translate function for a language. English text passes through.
 * @param {string} lang 'en' or 'es'
 * @returns {(text: string) => string}
 */
export function translatorFor(lang) {
  return lang === 'es' ? toSpanish : s => s;
}
