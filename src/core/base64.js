// @ts-check
// Base64 decoder that accepts the standard and the URL-safe alphabets. Used by TON addresses.

const BASE64_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

/**
 * @param {string} text
 * @returns {Uint8Array | null}
 */
export function base64Decode(text) {
  const s = text.replace(/-/g, '+').replace(/_/g, '/').replace(/=+$/, '');
  let bits = 0;
  let acc = 0;
  const out = [];
  for (const ch of s) {
    const v = BASE64_ALPHABET.indexOf(ch);
    if (v < 0) return null;
    acc = (acc << 6) | v;
    bits += 6;
    if (bits >= 8) { bits -= 8; out.push((acc >>> bits) & 255); }
    acc &= (1 << bits) - 1;
  }
  return Uint8Array.from(out);
}
