// @ts-check
// 64-bit helpers on BigInt, shared by Keccak and BLAKE2b. See ADR-017 for why we use BigInt.

export const U64_MASK = (1n << 64n) - 1n;

/**
 * Rotate a 64-bit value left.
 * @param {bigint} x
 * @param {bigint} n
 * @returns {bigint}
 */
export function rotl64(x, n) {
  return n === 0n ? x : ((x << n) | (x >> (64n - n))) & U64_MASK;
}

/**
 * Rotate a 64-bit value right.
 * @param {bigint} x
 * @param {bigint} n
 * @returns {bigint}
 */
export function rotr64(x, n) {
  return ((x >> n) | (x << (64n - n))) & U64_MASK;
}
