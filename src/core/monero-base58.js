// @ts-check
// Monero Base58: the data is cut into 8-byte blocks, and each block becomes 11 characters.
// The last 4 bytes are a Keccak-256 checksum of the rest.
import { BASE58_ALPHABET } from './base58.js';
import { keccak256 } from './keccak256.js';
import { bytesEqual } from './bytes.js';

const MONERO_BLOCK_SIZES = [0, 2, 3, 5, 6, 7, 9, 10, 11];

/**
 * Decode and verify a Monero address. Returns the body (without checksum) or null.
 * @param {string} text
 * @returns {Uint8Array | null}
 */
export function moneroBase58Decode(text) {
  if (text.length > 200 || !/^[1-9A-HJ-NP-Za-km-z]+$/.test(text)) return null;
  const out = [];
  for (let i = 0; i < text.length; i += 11) {
    const chunk = text.slice(i, i + 11);
    const n = MONERO_BLOCK_SIZES.indexOf(chunk.length);
    if (n < 0) return null;
    let v = 0n;
    for (const ch of chunk) v = v * 58n + BigInt(BASE58_ALPHABET.indexOf(ch));
    if (v >> BigInt(8 * n)) return null;
    for (let b = n - 1; b >= 0; b--) out.push(Number((v >> BigInt(8 * b)) & 255n));
  }
  const bytes = Uint8Array.from(out);
  if (bytes.length < 5) return null;
  const body = bytes.slice(0, -4);
  if (!bytesEqual(keccak256(body).slice(0, 4), bytes.slice(-4))) return null;
  return body;
}
