// @ts-check
// Blech32 and Blech32m (Liquid confidential addresses).
// Same idea as Bech32, but with a 12-character checksum and a 60-bit check value.
// The constants come from the Elements reference implementation. See docs/06-problems-and-fixes.md, P-06.
import { BECH32_CHARSET, hrpExpand } from './bech32.js';

const BLECH32_GENERATORS = [0x7d52fba40bd886n, 0x5e8dbf1a03950cn, 0x1c3a3c74072a18n, 0x385d72fa0e5139n, 0x7093e5a608865bn];
const BLECH32M_CONST = 0x455972a3350f7a1n;

/**
 * @param {string} text
 * @returns {{ hrp: string, data: number[], spec: 'blech32' | 'blech32m' } | null}
 */
export function blech32Decode(text) {
  if (text.length > 1023) return null;
  if (text !== text.toLowerCase() && text !== text.toUpperCase()) return null;
  const s = text.toLowerCase();
  const pos = s.lastIndexOf('1');
  if (pos < 1 || pos + 13 > s.length) return null;
  const hrp = s.slice(0, pos);
  const data = [];
  for (const c of s.slice(pos + 1)) {
    const d = BECH32_CHARSET.indexOf(c);
    if (d < 0) return null;
    data.push(d);
  }
  let chk = 1n;
  for (const v of hrpExpand(hrp).concat(data)) {
    const top = chk >> 55n;
    chk = ((chk & 0x7fffffffffffffn) << 5n) ^ BigInt(v);
    for (let i = 0; i < 5; i++) if ((top >> BigInt(i)) & 1n) chk ^= BLECH32_GENERATORS[i];
  }
  const spec = chk === 1n ? 'blech32' : chk === BLECH32M_CONST ? 'blech32m' : null;
  if (!spec) return null;
  return { hrp, data: data.slice(0, -12), spec };
}
