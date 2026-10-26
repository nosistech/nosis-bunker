// @ts-check
// SHA-512/256 (FIPS 180-4), used by Algorand address checksums.
// The constants are computed from their definitions (cube and square roots of primes,
// and the SHA-512/t IV generation function), so no table of 80 numbers can be mistyped.
import { U64_MASK, rotr64 } from './u64.js';
import { utf8 } from './bytes.js';

/** @param {bigint} n @param {bigint} k root degree (2 or 3) */
function sha512IntRoot(n, k) {
  let x = 1n << (BigInt(n.toString(2).length) / k + 1n);
  for (;;) {
    const y = ((k - 1n) * x + n / x ** (k - 1n)) / k;
    if (y >= x) return x;
    x = y;
  }
}

const SHA512_PRIMES = (() => {
  const out = [];
  for (let n = 2; out.length < 80; n++) if (out.every(p => n % p !== 0)) out.push(n);
  return out;
})();

// Fractional part of the root, as 64 bits: floor(root(p * 2^(64*k))) mod 2^64.
const SHA512_K = SHA512_PRIMES.map(p => sha512IntRoot(BigInt(p) << 192n, 3n) & U64_MASK);
const SHA512_IV = SHA512_PRIMES.slice(0, 8).map(p => sha512IntRoot(BigInt(p) << 128n, 2n) & U64_MASK);

/**
 * @param {Uint8Array | number[]} message
 * @param {bigint[]} iv
 * @returns {bigint[]} eight 64-bit words
 */
function sha512Core(message, iv) {
  const h = iv.slice();
  const len = message.length;
  const blocks = Math.ceil((len + 17) / 128);
  const buf = new Uint8Array(blocks * 128);
  buf.set(message);
  buf[len] = 0x80;
  const bits = BigInt(len) * 8n;
  for (let i = 0; i < 16; i++) buf[buf.length - 1 - i] = Number((bits >> BigInt(8 * i)) & 255n);
  const w = new Array(80);
  for (let off = 0; off < buf.length; off += 128) {
    for (let i = 0; i < 16; i++) {
      let v = 0n;
      for (let b = 0; b < 8; b++) v = (v << 8n) | BigInt(buf[off + i * 8 + b]);
      w[i] = v;
    }
    for (let i = 16; i < 80; i++) {
      const s0 = rotr64(w[i - 15], 1n) ^ rotr64(w[i - 15], 8n) ^ (w[i - 15] >> 7n);
      const s1 = rotr64(w[i - 2], 19n) ^ rotr64(w[i - 2], 61n) ^ (w[i - 2] >> 6n);
      w[i] = (w[i - 16] + s0 + w[i - 7] + s1) & U64_MASK;
    }
    let [a, b, c, d, e, f, g, hh] = h;
    for (let i = 0; i < 80; i++) {
      const t1 = (hh + (rotr64(e, 14n) ^ rotr64(e, 18n) ^ rotr64(e, 41n)) + ((e & f) ^ (~e & U64_MASK & g)) + SHA512_K[i] + w[i]) & U64_MASK;
      const t2 = ((rotr64(a, 28n) ^ rotr64(a, 34n) ^ rotr64(a, 39n)) + ((a & b) ^ (a & c) ^ (b & c))) & U64_MASK;
      hh = g; g = f; f = e; e = (d + t1) & U64_MASK; d = c; c = b; b = a; a = (t1 + t2) & U64_MASK;
    }
    const add = [a, b, c, d, e, f, g, hh];
    for (let i = 0; i < 8; i++) h[i] = (h[i] + add[i]) & U64_MASK;
  }
  return h;
}

/** @param {bigint[]} words @param {number} n bytes */
function sha512Bytes(words, n) {
  const out = new Uint8Array(n);
  for (let i = 0; i < n; i++) out[i] = Number((words[i >> 3] >> BigInt(56 - 8 * (i & 7))) & 255n);
  return out;
}

/**
 * Full SHA-512. Exported for tests.
 * @param {Uint8Array | number[]} message
 * @returns {Uint8Array}
 */
export function sha512(message) {
  return sha512Bytes(sha512Core(message, SHA512_IV), 64);
}

// SHA-512/t IV generation (FIPS 180-4, section 5.3.6): hash "SHA-512/256" with IV XOR a5a5...
const SHA512_256_IV = sha512Core(utf8('SHA-512/256'), SHA512_IV.map(v => v ^ 0xa5a5a5a5a5a5a5a5n));

/**
 * @param {Uint8Array | number[]} message
 * @returns {Uint8Array} 32-byte digest
 */
export function sha512t256(message) {
  return sha512Bytes(sha512Core(message, SHA512_256_IV), 32);
}
