// @ts-check
// Inputs that are not wallet addresses: extended public keys, names, and payment handles.
import { verdict, MODEL } from '../model.js';

/**
 * @param {string} a
 * @returns {import('../model.js').Verdict | null}
 */
export function detectIdentifier(a) {
  if (/^(xpub|ypub|zpub|tpub|upub|vpub|Ypub|Zpub|Ltub|Mtub|dgub)[1-9A-HJ-NP-Za-km-z]{90,120}$/.test(a)) {
    return verdict('btc', 'Extended public key', MODEL.XPUB,
      'An xpub shows the public key of every address in that wallet. Do not share it with trackers or websites.');
  }
  if (/^[a-z0-9-]{1,63}\.(eth|sol|sui|apt|btc|bnb|arb|base)$/i.test(a)) {
    return verdict(null, 'Name, not an address', MODEL.UNKNOWN, 'This tool does not look up names. Paste the address that the name points to.');
  }
  if (/^[^@\s]{1,64}@[a-z0-9-]{1,63}(\.[a-z0-9-]{1,63}){1,5}$/i.test(a)) {
    return verdict(null, 'Lightning address or payment handle', MODEL.UNKNOWN,
      'This points to a payment server, not to a key. Examine the wallet behind it.');
  }
  return null;
}
