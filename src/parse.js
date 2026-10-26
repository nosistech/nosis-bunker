// @ts-check
// parseInput(): the text from the input box in, a list of entries out.
// Step 1: look for secrets. Step 2: split lines. Step 3: classify each address.
import { findSecret } from './guard.js';
import { classify } from './classify.js';
import { verdict, MODEL } from './model.js';

/** Input limits (OWASP: limit input size so the page stays fast). */
export const MAX_INPUT_CHARS = 100000;
export const MAX_LINES = 500;
const MAX_LABEL_CHARS = 40;

/**
 * @typedef {import('./model.js').Verdict & { id: string, address: string, label: string, sent: string, value: number | null, detector: string }} Entry
 */

/** The most characters of an unrecognized token that an entry keeps. A long unknown token is not an address. */
const MAX_UNKNOWN_CHARS = 64;

/**
 * Remove control characters, invisible format characters and broken surrogates from a label or
 * an address, so text cannot reorder what is next to it on the page or hide characters in agent output.
 * @param {string} s
 */
export function cleanLabel(s) {
  return s.replace(/[\p{Cc}\p{Cf}\p{Cs}]/gu, '').trim();
}

/**
 * True when no detector recognized the token. Such a token is not shown in full to agents (P-39).
 * @param {{ type: string, model: string }} v
 */
export function isUnrecognized(v) {
  return v.model === MODEL.UNKNOWN && v.type === 'Not recognized';
}

/**
 * @param {string} text
 * @returns {{ secret: string | null, entries: Entry[], truncated: boolean }}
 */
export function parseInput(text) {
  const input = String(text);
  const truncated = input.length > MAX_INPUT_CHARS;
  const safeText = truncated ? input.slice(0, MAX_INPUT_CHARS) : input;
  const secret = findSecret(safeText);
  if (secret) return { secret, entries: [], truncated };
  const seen = new Set();
  /** @type {Entry[]} */
  const entries = [];
  const lines = safeText.split(/\r?\n/).slice(0, MAX_LINES);
  for (const line of lines) {
    const parts = line.trim().split(/\s+/).filter(Boolean);
    if (!parts.length) continue;
    const address = cleanLabel(parts[0].replace(/[,;]$/, ''));
    const label = cleanLabel(parts.slice(1).join(' ')).slice(0, MAX_LABEL_CHARS);
    let v;
    try {
      v = classify(address);
    } catch {
      // OWASP: fail safe. A bug in one detector must not break the whole page.
      v = { ...verdict(null, 'Not recognized', MODEL.UNKNOWN, 'This tool could not read this line.'), detector: 'error' };
    }
    // One line for each account: a detector can give two spellings the same normalized address.
    const key = (v.address || address).toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    entries.push({
      ...v,
      id: 'e' + entries.length,
      address: v.address || (isUnrecognized(v) ? address.slice(0, MAX_UNKNOWN_CHARS) : address),
      label,
      sent: 'unsure',
      value: null,
    });
  }
  return { secret: null, entries, truncated: truncated || safeText.split(/\r?\n/).length > MAX_LINES };
}
