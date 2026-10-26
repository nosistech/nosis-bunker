// @ts-check
// Keccak-256 (the original Keccak padding used by Ethereum and Monero, not NIST SHA3-256).
// Used for EIP-55 checksums and Monero address checksums.
import { U64_MASK, rotl64 } from './u64.js';

const KECCAK_RHO = [0, 1, 62, 28, 27, 36, 44, 6, 55, 20, 3, 10, 43, 25, 39, 41, 45, 15, 21, 8, 18, 2, 61, 56, 14].map(BigInt);

// Round constants come from the Keccak LFSR, so no table of 24 magic numbers can be mistyped.
const KECCAK_ROUND_CONSTANTS = (() => {
  const bit = t => {
    if (t % 255 === 0) return 1;
    let r = 1;
    for (let i = 1; i <= t % 255; i++) { r <<= 1; if (r & 0x100) r ^= 0x171; }
    return r & 1;
  };
  const out = [];
  for (let i = 0; i < 24; i++) {
    let rc = 0n;
    for (let j = 0; j < 7; j++) if (bit(j + 7 * i)) rc |= 1n << BigInt((1 << j) - 1);
    out.push(rc);
  }
  return out;
})();

/** @param {bigint[]} A 25 lanes, changed in place */
function keccakPermute(A) {
  const C = new Array(5);
  const B = new Array(25);
  for (let round = 0; round < 24; round++) {
    for (let x = 0; x < 5; x++) C[x] = A[x] ^ A[x + 5] ^ A[x + 10] ^ A[x + 15] ^ A[x + 20];
    for (let x = 0; x < 5; x++) {
      const D = C[(x + 4) % 5] ^ rotl64(C[(x + 1) % 5], 1n);
      for (let y = 0; y < 25; y += 5) A[x + y] ^= D;
    }
    for (let x = 0; x < 5; x++) for (let y = 0; y < 5; y++) {
      B[y + 5 * ((2 * x + 3 * y) % 5)] = rotl64(A[x + 5 * y], KECCAK_RHO[x + 5 * y]);
    }
    for (let y = 0; y < 25; y += 5) for (let x = 0; x < 5; x++) {
      A[x + y] = B[x + y] ^ ((~B[((x + 1) % 5) + y] & U64_MASK) & B[((x + 2) % 5) + y]);
    }
    A[0] ^= KECCAK_ROUND_CONSTANTS[round];
  }
}

/**
 * @param {Uint8Array | number[]} bytes
 * @returns {Uint8Array} 32-byte digest
 */
export function keccak256(bytes) {
  const rate = 136;
  const pad = rate - (bytes.length % rate);
  const msg = new Uint8Array(bytes.length + pad);
  msg.set(bytes);
  msg[bytes.length] ^= 0x01;
  msg[msg.length - 1] ^= 0x80;
  const A = new Array(25).fill(0n);
  for (let off = 0; off < msg.length; off += rate) {
    for (let i = 0; i < rate / 8; i++) {
      let v = 0n;
      for (let b = 7; b >= 0; b--) v = (v << 8n) | BigInt(msg[off + i * 8 + b]);
      A[i] ^= v;
    }
    keccakPermute(A);
  }
  const out = new Uint8Array(32);
  for (let i = 0; i < 4; i++) for (let b = 0; b < 8; b++) out[i * 8 + b] = Number((A[i] >> BigInt(8 * b)) & 255n);
  return out;
}
