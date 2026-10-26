// @ts-check
// Bech32 (BIP-173) and Bech32m (BIP-350). Many networks use this format with their own prefix (the "HRP").

export const BECH32_CHARSET = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l';
const BECH32M_CONST = 0x2bc830a3;

/**
 * Expand the human-readable part for the checksum.
 * @param {string} hrp
 * @returns {number[]}
 */
export function hrpExpand(hrp) {
  const high = [...hrp].map(c => c.charCodeAt(0) >> 5);
  const low = [...hrp].map(c => c.charCodeAt(0) & 31);
  return high.concat([0], low);
}

/** @param {number[]} values */
function bech32Polymod(values) {
  const G = [0x3b6a57b2, 0x26508e6d, 0x1ea119fa, 0x3d4233dd, 0x2a1462b3];
  let chk = 1;
  for (const v of values) {
    const top = chk >>> 25;
    chk = ((chk & 0x1ffffff) << 5) ^ v;
    for (let i = 0; i < 5; i++) if ((top >>> i) & 1) chk ^= G[i];
  }
  return chk >>> 0;
}

/**
 * @typedef {{ hrp: string, data: number[], spec: 'bech32' | 'bech32m' }} Bech32Result
 */

/**
 * Decode Bech32 or Bech32m text. Returns null when the text or checksum is not valid.
 * maxLen is 1023 for long formats such as Lightning invoices. BIP-173 addresses stay under 90.
 * @param {string} text
 * @param {number} [maxLen]
 * @returns {Bech32Result | null}
 */
export function bech32Decode(text, maxLen = 1023) {
  if (text.length > maxLen) return null;
  if (text !== text.toLowerCase() && text !== text.toUpperCase()) return null;
  const s = text.toLowerCase();
  const pos = s.lastIndexOf('1');
  if (pos < 1 || pos + 7 > s.length) return null;
  const hrp = s.slice(0, pos);
  const data = [];
  for (const c of s.slice(pos + 1)) {
    const d = BECH32_CHARSET.indexOf(c);
    if (d === -1) return null;
    data.push(d);
  }
  const pm = bech32Polymod(hrpExpand(hrp).concat(data));
  const spec = pm === 1 ? 'bech32' : pm === BECH32M_CONST ? 'bech32m' : null;
  if (!spec) return null;
  return { hrp, data: data.slice(0, -6), spec };
}

/**
 * Encode 5-bit data as Bech32 or Bech32m. Used by tests to build sample addresses.
 * @param {string} hrp
 * @param {number[]} data
 * @param {'bech32' | 'bech32m'} spec
 * @returns {string}
 */
export function bech32Encode(hrp, data, spec = 'bech32') {
  const c = spec === 'bech32m' ? BECH32M_CONST : 1;
  const pm = bech32Polymod(hrpExpand(hrp).concat(data, [0, 0, 0, 0, 0, 0])) ^ c;
  const sum = [];
  for (let i = 0; i < 6; i++) sum.push((pm >>> (5 * (5 - i))) & 31);
  return hrp + '1' + data.concat(sum).map(d => BECH32_CHARSET[d]).join('');
}

/**
 * Regroup bits, for example 5-bit groups to bytes. Returns null on invalid padding.
 * @param {ArrayLike<number>} data
 * @param {number} from
 * @param {number} to
 * @param {boolean} pad
 * @returns {number[] | null}
 */
export function convertBits(data, from, to, pad) {
  let acc = 0;
  let bits = 0;
  const out = [];
  const maxv = (1 << to) - 1;
  for (let i = 0; i < data.length; i++) {
    acc = (acc << from) | data[i];
    bits += from;
    while (bits >= to) { bits -= to; out.push((acc >>> bits) & maxv); }
    acc &= (1 << bits) - 1;
  }
  if (pad) { if (bits > 0) out.push((acc << (to - bits)) & maxv); }
  else if (bits >= from || ((acc << (to - bits)) & maxv)) return null;
  return out;
}
