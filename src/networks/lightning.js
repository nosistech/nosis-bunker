// @ts-check
// Lightning: node IDs, BOLT 11 invoices, BOLT 12 offers and LNURL.
// Lightning node keys are public by design.
import { verdict, MODEL, TEXT } from '../model.js';
import { bech32Decode } from '../core/bech32.js';

/**
 * @param {string} a
 * @returns {import('../model.js').Verdict | null}
 */
export function detectLightning(a) {
  if (/^0[23][0-9a-fA-F]{64}$/.test(a)) {
    return verdict('lightning', 'Public key (Lightning node ID)', MODEL.VISIBLE,
      'This is a public key. The Lightning network publishes node IDs to all users.');
  }
  if (a.length <= 4000 && /^ln(bc|tb|bcrt|tbs|sb)[0-9a-z]*1[02-9ac-hj-np-z]+$/i.test(a)) {
    if (!bech32Decode(a, 4000)) return verdict(null, 'Checksum failed', MODEL.UNKNOWN, 'This looks like a Lightning invoice, but the checksum is wrong.');
    if (!/^lnbc/i.test(a)) return verdict(null, 'Lightning test invoice', MODEL.UNKNOWN, TEXT.TESTNET);
    return verdict('lightning', 'Lightning invoice', MODEL.VISIBLE,
      'An invoice contains the public key of the node that receives the payment.', { noLink: true });
  }
  if (a.length <= 4000 && /^lno1[02-9ac-hj-np-z]+$/i.test(a)) {
    return verdict('lightning', 'Lightning offer (BOLT 12)', MODEL.VISIBLE,
      'An offer contains a public key, so payers can find the node.', { noLink: true });
  }
  if (a.length <= 4000 && /^lnurl1[02-9ac-hj-np-z]+$/i.test(a)) {
    return verdict(null, 'LNURL', MODEL.UNKNOWN, 'An LNURL points to a server, not to a key. Examine the wallet behind it.');
  }
  return null;
}
