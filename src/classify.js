// @ts-check
// classify(): one address in, one verdict out. It runs the detectors in order (networks/index.js).
import { DETECTORS } from './networks/index.js';
import { verdict, MODEL } from './model.js';

/** Longer inputs are rejected before any parsing (OWASP: limit input size). */
export const MAX_ADDRESS_LENGTH = 4000;

/**
 * @param {string} address
 * @returns {import('./model.js').Verdict & { detector: string }}
 */
export function classify(address) {
  const a = String(address).trim();
  if (!a || a.length > MAX_ADDRESS_LENGTH) {
    return { ...verdict(null, 'Not recognized', MODEL.UNKNOWN, 'The text is empty or too long to be an address.'), detector: 'none' };
  }
  for (const d of DETECTORS) {
    const v = d.detect(a);
    if (v) return { ...v, detector: d.name };
  }
  return { ...verdict(null, 'Not recognized', MODEL.UNKNOWN, 'This tool does not know this format. Look for a typo or a missing character.'), detector: 'none' };
}
