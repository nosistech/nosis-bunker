// @ts-check
// CashAddr networks: Bitcoin Cash, eCash and Kaspa.
import { verdict, checksumFailed, MODEL, TEXT } from '../model.js';
import { cashaddrDecode } from '../core/cashaddr.js';

const KASPA_SCRIPT_VERSION = 8;

/**
 * @param {string} a
 * @returns {import('../model.js').Verdict | null}
 */
export function detectCashAddr(a) {
  if (/^(bitcoincash:)?[qp][02-9ac-hj-np-z]{41}$/i.test(a)) {
    const c = cashaddrDecode(a, 'bitcoincash');
    if (!c) return checksumFailed('a Bitcoin Cash address');
    return verdict('bch', c.version === 0 ? 'CashAddr (P2PKH)' : 'CashAddr (P2SH)', MODEL.HIDDEN_UNTIL_USED, TEXT.SEGWIT_HIDDEN);
  }
  if (/^ecash:[qp][02-9ac-hj-np-z]{41}$/i.test(a)) {
    if (!cashaddrDecode(a)) return checksumFailed('an eCash address');
    return verdict('xec', 'eCash address', MODEL.HIDDEN_UNTIL_USED, TEXT.SEGWIT_HIDDEN);
  }
  if (/^kaspa(test|dev|sim)?:[02-9ac-hj-np-z]{55,70}$/i.test(a)) {
    const c = cashaddrDecode(a);
    if (!c) return checksumFailed('a Kaspa address');
    if (c.prefix !== 'kaspa') return verdict(null, 'Kaspa test address', MODEL.UNKNOWN, TEXT.TESTNET);
    if (c.version === KASPA_SCRIPT_VERSION) return verdict('kas', 'Kaspa script address', MODEL.HIDDEN_UNTIL_USED, 'Only a hash of the script is on chain until it spends.');
    return verdict('kas', 'Kaspa address', MODEL.VISIBLE, 'A standard Kaspa address is the public key, so the lock is visible from day one.');
  }
  return null;
}
