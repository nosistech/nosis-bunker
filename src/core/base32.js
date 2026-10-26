// @ts-check
// RFC 4648 Base32, lowercase, no padding. Used by Filecoin and Internet Computer.

export const BASE32_ALPHABET = 'abcdefghijklmnopqrstuvwxyz234567';

/**
 * @param {string} text
 * @returns {Uint8Array | null}
 */
export function base32Decode(text) {
  let bits = 0;
  let acc = 0;
  const out = [];
  for (const ch of text.toLowerCase()) {
    const v = BASE32_ALPHABET.indexOf(ch);
    if (v < 0) return null;
    acc = (acc << 5) | v;
    bits += 5;
    if (bits >= 8) { bits -= 8; out.push((acc >>> bits) & 255); }
    acc &= (1 << bits) - 1;
  }
  // Canonical form only: the unused bits in the last character must be zero.
  // Without this rule, two different strings decode to the same bytes, and a typo in the
  // last character can pass the checksum. See docs/06-problems-and-fixes.md, P-20.
  if (acc !== 0) return null;
  return Uint8Array.from(out);
}

/**
 * @param {ArrayLike<number>} bytes
 * @returns {string}
 */
export function base32Encode(bytes) {
  let bits = 0;
  let acc = 0;
  let out = '';
  for (let i = 0; i < bytes.length; i++) {
    acc = (acc << 8) | bytes[i];
    bits += 8;
    while (bits >= 5) { bits -= 5; out += BASE32_ALPHABET[(acc >>> bits) & 31]; }
    acc &= (1 << bits) - 1;
  }
  if (bits > 0) out += BASE32_ALPHABET[(acc << (5 - bits)) & 31];
  return out;
}
