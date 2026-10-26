// @ts-check
// SHA-256 (FIPS 180-4). Used by Base58Check, Stacks c32check and the build hash.
// We do not use WebCrypto because it is async and not available in every context. See ADR-003.

const SHA256_CONSTANTS = (() => {
  const primes = [];
  for (let n = 2; primes.length < 64; n++) {
    if (primes.every(p => n % p !== 0)) primes.push(n);
  }
  const frac = x => ((x - Math.floor(x)) * 4294967296) >>> 0;
  return {
    k: primes.map(p => frac(Math.cbrt(p))),
    h: primes.slice(0, 8).map(p => frac(Math.sqrt(p))),
  };
})();

/**
 * @param {Uint8Array | number[]} message
 * @returns {Uint8Array} 32-byte digest
 */
export function sha256(message) {
  const k = SHA256_CONSTANTS.k;
  const h = SHA256_CONSTANTS.h.slice();
  const len = message.length;
  const padded = new Uint8Array(((len + 9 + 63) >> 6) << 6);
  padded.set(message);
  padded[len] = 0x80;
  const view = new DataView(padded.buffer);
  const bits = len * 8;
  view.setUint32(padded.length - 4, bits >>> 0);
  view.setUint32(padded.length - 8, Math.floor(bits / 4294967296));
  const w = new Uint32Array(64);
  const rotr = (x, n) => (x >>> n) | (x << (32 - n));
  for (let off = 0; off < padded.length; off += 64) {
    for (let i = 0; i < 16; i++) w[i] = view.getUint32(off + i * 4);
    for (let i = 16; i < 64; i++) {
      const s0 = rotr(w[i - 15], 7) ^ rotr(w[i - 15], 18) ^ (w[i - 15] >>> 3);
      const s1 = rotr(w[i - 2], 17) ^ rotr(w[i - 2], 19) ^ (w[i - 2] >>> 10);
      w[i] = (w[i - 16] + s0 + w[i - 7] + s1) >>> 0;
    }
    let [a, b, c, d, e, f, g, hh] = h;
    for (let i = 0; i < 64; i++) {
      const t1 = (hh + (rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25)) + ((e & f) ^ (~e & g)) + k[i] + w[i]) >>> 0;
      const t2 = ((rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22)) + ((a & b) ^ (a & c) ^ (b & c))) >>> 0;
      hh = g; g = f; f = e; e = (d + t1) >>> 0; d = c; c = b; b = a; a = (t1 + t2) >>> 0;
    }
    h[0] = (h[0] + a) >>> 0; h[1] = (h[1] + b) >>> 0; h[2] = (h[2] + c) >>> 0; h[3] = (h[3] + d) >>> 0;
    h[4] = (h[4] + e) >>> 0; h[5] = (h[5] + f) >>> 0; h[6] = (h[6] + g) >>> 0; h[7] = (h[7] + hh) >>> 0;
  }
  const out = new Uint8Array(32);
  const ov = new DataView(out.buffer);
  h.forEach((v, i) => ov.setUint32(i * 4, v));
  return out;
}

/**
 * Double SHA-256, used by Base58Check and c32check.
 * @param {Uint8Array | number[]} message
 * @returns {Uint8Array}
 */
export function sha256d(message) {
  return sha256(sha256(message));
}
