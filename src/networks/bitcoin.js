// @ts-check
// Bitcoin-style SegWit addresses (bc, ltc, dgb, Liquid ex) and Silent Payments (sp).
import { verdict, checksumFailed, MODEL, TEXT } from '../model.js';
import { convertBits } from '../core/bech32.js';

/** SegWit prefix for each network that uses witness programs. */
const SEGWIT_HRP = Object.freeze({ bc: 'btc', ltc: 'ltc', dgb: 'dgb', ex: 'liquid' });

/**
 * @param {import('../core/bech32.js').Bech32Result} dec
 * @returns {import('../model.js').Verdict | null}
 */
export function bitcoinBech32Verdict(dec) {
  if (dec.hrp === 'sp' && dec.data[0] === 0) {
    // BIP-352: Bech32m, version 0, two 33-byte keys (66 bytes: the version character plus 106 characters of data).
    if (dec.spec !== 'bech32m' || dec.data.length !== 107) return checksumFailed('a Silent Payment address');
    return verdict('btc', 'Silent Payment address (BIP-352)', MODEL.VISIBLE,
      'A Silent Payment address publishes its scan and spend public keys, so senders can pay it in private.', { noLink: true });
  }
  const coin = SEGWIT_HRP[dec.hrp];
  if (!coin) return null;
  const ver = dec.data[0];
  const prog = convertBits(dec.data.slice(1), 5, 8, false);
  // BIP-141: a witness program is 2 to 40 bytes. BIP-350: version 0 uses Bech32, version 1 and up use Bech32m.
  if (!prog || ver > 16 || prog.length < 2 || prog.length > 40) return checksumFailed('a SegWit address');
  if ((ver === 0 && dec.spec !== 'bech32') || (ver > 0 && dec.spec !== 'bech32m')) return checksumFailed('a SegWit address (the encoding does not match the version)');
  if (ver === 0 && prog.length !== 20 && prog.length !== 32) return checksumFailed('a SegWit address');
  const p = dec.hrp + '1';
  if (ver === 0 && prog.length === 20) return verdict(coin, 'Native SegWit (' + p + 'q)', MODEL.HIDDEN_UNTIL_USED, TEXT.SEGWIT_HIDDEN);
  if (ver === 0 && prog.length === 32) return verdict(coin, 'SegWit script (multisig)', MODEL.HIDDEN_UNTIL_USED, TEXT.SCRIPT_HIDDEN);
  if (ver === 1 && prog.length === 32) {
    return verdict(coin, 'Taproot (' + p + 'p)', MODEL.VISIBLE,
      coin === 'btc' ? 'Taproot puts the public key in the address. Ordinals and Runes use this type.' : 'Taproot puts the public key in the address.');
  }
  if (ver === 2 && coin === 'btc' && prog.length === 32) {
    return verdict(coin, 'Pay-to-Merkle-Root (BIP-360)', MODEL.HASH_SAFE, 'A BIP-360 output shows no curve key. You can use it only after the upgrade activates.');
  }
  return verdict(coin, 'SegWit v' + ver + ' (future type)', MODEL.HIDDEN_UNTIL_USED, 'This witness version is new to this tool. Treat it as hidden until it spends.');
}
