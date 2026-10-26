// @ts-check
// Base58 and Base58Check, as used by Bitcoin, Tron, Solana, Tezos, Zcash, Mina, Polkadot and others.
import { sha256d } from './sha256.js';
import { bytesEqual } from './bytes.js';

export const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

/**
 * Decode Base58 text. Returns null for any character outside the alphabet.
 * @param {string} text
 * @returns {Uint8Array | null}
 */
export function base58Decode(text) {
  if (!/^[1-9A-HJ-NP-Za-km-z]+$/.test(text)) return null;
  const bytes = [];
  for (const ch of text) {
    let carry = BASE58_ALPHABET.indexOf(ch);
    for (let j = 0; j < bytes.length; j++) {
      carry += bytes[j] * 58;
      bytes[j] = carry & 255;
      carry >>= 8;
    }
    while (carry > 0) { bytes.push(carry & 255); carry >>= 8; }
  }
  let zeros = 0;
  for (const ch of text) { if (ch === '1') zeros++; else break; }
  return Uint8Array.from([...new Array(zeros).fill(0), ...bytes.reverse()]);
}

/**
 * Encode bytes as Base58 text.
 * @param {ArrayLike<number>} bytes
 * @returns {string}
 */
export function base58Encode(bytes) {
  const digits = [];
  for (let i = 0; i < bytes.length; i++) {
    let carry = bytes[i];
    for (let j = 0; j < digits.length; j++) {
      carry += digits[j] << 8;
      digits[j] = carry % 58;
      carry = (carry / 58) | 0;
    }
    while (carry > 0) { digits.push(carry % 58); carry = (carry / 58) | 0; }
  }
  let out = '';
  for (let i = 0; i < bytes.length && bytes[i] === 0; i++) out += '1';
  for (let i = digits.length - 1; i >= 0; i--) out += BASE58_ALPHABET[digits[i]];
  return out;
}

/**
 * Decode Base58Check: payload + 4-byte double-SHA-256 checksum.
 * Returns the payload, or null when the text or checksum is not valid.
 * @param {string} text
 * @returns {Uint8Array | null}
 */
export function base58CheckDecode(text) {
  const raw = base58Decode(text);
  if (!raw || raw.length < 5) return null;
  const payload = raw.slice(0, -4);
  if (!bytesEqual(sha256d(payload).slice(0, 4), raw.slice(-4))) return null;
  return payload;
}

/**
 * Encode a payload as Base58Check. Used by tests to build sample addresses.
 * @param {ArrayLike<number>} payload
 * @returns {string}
 */
export function base58CheckEncode(payload) {
  const p = Uint8Array.from(payload);
  const sum = sha256d(p).slice(0, 4);
  return base58Encode(Uint8Array.from([...p, ...sum]));
}
