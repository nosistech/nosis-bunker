// @ts-check
// Stacks c32check: 'S' + version character + c32(hash160 + checksum).
// The checksum is the first 4 bytes of double SHA-256 over (version byte + hash160).
import { sha256d } from './sha256.js';
import { bytesEqual } from './bytes.js';

export const C32_ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

/**
 * @param {string} text
 * @returns {{ version: number } | null}
 */
export function c32CheckDecode(text) {
  if (!/^S[PMTN][0-9A-Za-z]{5,41}$/.test(text)) return null;
  // c32 treats O as 0 and I or L as 1.
  const norm = text.toUpperCase().replace(/O/g, '0').replace(/[IL]/g, '1');
  const version = C32_ALPHABET.indexOf(norm[1]);
  const bytes = [];
  for (const c of norm.slice(2)) {
    let carry = C32_ALPHABET.indexOf(c);
    if (carry < 0) return null;
    for (let j = 0; j < bytes.length; j++) {
      carry += bytes[j] * 32;
      bytes[j] = carry & 255;
      carry >>= 8;
    }
    while (carry > 0) { bytes.push(carry & 255); carry >>= 8; }
  }
  bytes.reverse();
  while (bytes.length < 24) bytes.unshift(0);
  if (bytes.length !== 24) return null;
  const sum = sha256d(Uint8Array.from([version, ...bytes.slice(0, 20)]));
  if (!bytesEqual(sum.slice(0, 4), bytes.slice(20))) return null;
  return { version };
}
