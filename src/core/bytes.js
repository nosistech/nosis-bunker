// @ts-check
// Small byte helpers. No other module in core depends on anything outside core.

/**
 * Convert a hex string (even length, no prefix) to bytes.
 * @param {string} hex
 * @returns {Uint8Array}
 */
export function hexToBytes(hex) {
  if (hex.length % 2 !== 0 || !/^[0-9a-fA-F]*$/.test(hex)) throw new Error('hexToBytes: bad hex');
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return out;
}

/**
 * Compare two byte arrays.
 * @param {ArrayLike<number>} a
 * @param {ArrayLike<number>} b
 * @returns {boolean}
 */
export function bytesEqual(a, b) {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}

/**
 * Encode a string as UTF-8 bytes.
 * @param {string} text
 * @returns {Uint8Array}
 */
export function utf8(text) {
  return new TextEncoder().encode(text);
}

/**
 * Read 4 bytes as a big-endian unsigned integer.
 * @param {ArrayLike<number>} b
 * @param {number} offset
 * @returns {number}
 */
export function readUint32BE(b, offset) {
  return ((b[offset] << 24) | (b[offset + 1] << 16) | (b[offset + 2] << 8) | b[offset + 3]) >>> 0;
}
