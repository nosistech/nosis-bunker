// @ts-check
// Monero standard (4...), subaddress (8...) and integrated (4..., 106 characters) addresses.
// A Monero address contains its public spend key and view key.
import { verdict, checksumFailed, MODEL } from '../model.js';
import { moneroBase58Decode } from '../core/monero-base58.js';

const XMR_SUBADDRESS = 0x2a;
const XMR_INTEGRATED = 0x13;

/**
 * @param {string} a
 * @returns {import('../model.js').Verdict | null}
 */
export function detectMonero(a) {
  if (!/^[48][1-9A-HJ-NP-Za-km-z]{94}$/.test(a) && !/^4[1-9A-HJ-NP-Za-km-z]{105}$/.test(a)) return null;
  const body = moneroBase58Decode(a);
  if (!body) return checksumFailed('a Monero address');
  const kind = body[0] === XMR_SUBADDRESS ? 'Monero subaddress' : body[0] === XMR_INTEGRATED ? 'Monero integrated address' : 'Monero address';
  return verdict('xmr', kind, MODEL.VISIBLE, 'A Monero address contains its public spend key and view key. No Monero address type hides them.');
}
