// @ts-check
// Cardano Shelley addresses (addr1...) and stake addresses (stake1...).
import { verdict, checksumFailed, MODEL } from '../model.js';
import { convertBits } from '../core/bech32.js';

/** Header types whose payment part is a script, not a key hash (CIP-19). */
const CARDANO_SCRIPT_HEADERS = [1, 3, 5, 7];

/**
 * @param {import('../core/bech32.js').Bech32Result} dec
 * @returns {import('../model.js').Verdict | null}
 */
export function cardanoVerdict(dec) {
  if (dec.hrp === 'addr') {
    const bytes = convertBits(dec.data, 5, 8, false);
    const header = bytes ? bytes[0] >> 4 : -1;
    // CIP-19: payment addresses use header types 0 to 7 (14 and 15 are stake addresses, 8 is Byron).
    if (header < 0 || header > 7 || (bytes && bytes[0] & 0x0f) !== 1) return checksumFailed('a Cardano address (the header is not a payment address)');
    const script = CARDANO_SCRIPT_HEADERS.includes(header);
    return verdict('ada', script ? 'Script address' : 'Payment address', MODEL.HIDDEN_UNTIL_USED,
      script ? 'The script conditions appear when it spends.' : 'Only a hash of the payment key is on chain until it spends.');
  }
  if (dec.hrp === 'stake') {
    const bytes = convertBits(dec.data, 5, 8, false);
    const header = bytes ? bytes[0] >> 4 : -1;
    if (header !== 14 && header !== 15) return checksumFailed('a Cardano stake address (the header is not a stake address)');
    return verdict('ada', 'Stake address', MODEL.HIDDEN_UNTIL_USED, 'The stake key appears when you delegate or withdraw rewards.');
  }
  return null;
}
