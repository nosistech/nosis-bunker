// @ts-check
// Polkadot, Kusama, Bittensor and other Substrate networks (SS58 format).
// SS58 = Base58(prefix + 32-byte public key + 2-byte BLAKE2b checksum over "SS58PRE" + prefix + key).
import { verdict, MODEL } from '../model.js';
import { base58Decode } from '../core/base58.js';
import { blake2b } from '../core/blake2b.js';
import { utf8 } from '../core/bytes.js';

/** SS58 prefix: [network name, explorer template or null]. Links checked against live explorer pages. */
export const SS58_NETWORKS = Object.freeze({
  0: ['Polkadot', 'https://polkadot.subscan.io/account/{a}'],
  2: ['Kusama', 'https://kusama.subscan.io/account/{a}'],
  5: ['Astar', 'https://astar.subscan.io/account/{a}'],
  6: ['Bifrost', 'https://bifrost.subscan.io/account/{a}'],
  10: ['Acala', 'https://acala.subscan.io/account/{a}'],
  12: ['Polymesh (regulated securities)', 'https://polymesh.subscan.io/account/{a}'],
  36: ['Centrifuge (real-world assets)', 'https://centrifuge.subscan.io/account/{a}'],
  38: ['KILT', 'https://spiritnet.subscan.io/account/{a}'],
  42: ['Bittensor (TAO) or other Substrate network', 'https://taostats.io/account/{a}'],
  63: ['Hydration', 'https://hydration.subscan.io/account/{a}'],
});

/**
 * @param {string} s
 * @returns {{ prefix: number } | null} null when the format or checksum is not valid
 */
export function ss58Decode(s) {
  const raw = base58Decode(s);
  if (!raw || (raw.length !== 35 && raw.length !== 36)) return null;
  let prefix;
  let offset;
  if (raw[0] < 64) { prefix = raw[0]; offset = 1; }
  else if (raw[0] < 128) { prefix = ((raw[0] & 0x3f) << 2) | (raw[1] >> 6) | ((raw[1] & 0x3f) << 8); offset = 2; }
  else return null;
  if (raw.length - offset !== 34) return null;
  const pre = utf8('SS58PRE');
  const buf = new Uint8Array(pre.length + raw.length - 2);
  buf.set(pre);
  buf.set(raw.slice(0, -2), pre.length);
  const h = blake2b(buf, 64);
  if (h[0] !== raw[raw.length - 2] || h[1] !== raw[raw.length - 1]) return null;
  return { prefix };
}

/**
 * @param {string} a
 * @returns {import('../model.js').Verdict | null}
 */
export function detectSubstrate(a) {
  if (a.length < 46 || a.length > 50) return null;
  const r = ss58Decode(a);
  if (!r) return null;
  const known = Object.prototype.hasOwnProperty.call(SS58_NETWORKS, r.prefix);
  const [name, explorer] = known ? SS58_NETWORKS[r.prefix] : ['Substrate network (prefix ' + r.prefix + ')', null];
  return verdict('substrate', name.replace(/ \(.*\)$/, '') + ' account', MODEL.VISIBLE,
    'A Substrate address contains the public key.', { chainLabel: name, explorer });
}
