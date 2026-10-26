// @ts-check
// CashAddr, used by Bitcoin Cash, eCash and Kaspa. 40-bit checksum, prefix separated by ':'.
import { BECH32_CHARSET, convertBits } from './bech32.js';

const CASHADDR_GENERATORS = [0x98f2bc8e61n, 0x79b76d99e2n, 0xf33e5fb3c4n, 0xae2eabe2a8n, 0x1e4f43e470n];

/**
 * Decode CashAddr text. If the text has no prefix, defaultPrefix is used for the checksum.
 * @param {string} text
 * @param {string} [defaultPrefix]
 * @returns {{ prefix: string, version: number, payload: number[] } | null}
 */
export function cashaddrDecode(text, defaultPrefix = '') {
  if (text.length > 120) return null;
  if (text !== text.toLowerCase() && text !== text.toUpperCase()) return null;
  const s = text.toLowerCase();
  const i = s.lastIndexOf(':');
  const prefix = i >= 0 ? s.slice(0, i) : defaultPrefix;
  const body = i >= 0 ? s.slice(i + 1) : s;
  if (!prefix) return null;
  const data = [];
  for (const c of body) {
    const d = BECH32_CHARSET.indexOf(c);
    if (d < 0) return null;
    data.push(d);
  }
  if (data.length < 9) return null;
  let chk = 1n;
  for (const d of [...prefix].map(ch => ch.charCodeAt(0) & 31).concat([0], data)) {
    const top = chk >> 35n;
    chk = ((chk & 0x07ffffffffn) << 5n) ^ BigInt(d);
    for (let k = 0; k < 5; k++) if ((top >> BigInt(k)) & 1n) chk ^= CASHADDR_GENERATORS[k];
  }
  if ((chk ^ 1n) !== 0n) return null;
  const bytes = convertBits(data.slice(0, -8), 5, 8, false);
  if (!bytes || !bytes.length) return null;
  return { prefix, version: bytes[0], payload: bytes.slice(1) };
}
