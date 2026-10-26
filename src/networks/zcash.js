// @ts-check
// Zcash: transparent (t1, t3), TEX (ZIP-320), Sapling (zs1) and unified (u1) addresses.
// Shielded ratings follow Zcash's own quantum-resilience analysis (ZIP 2005 draft) and the
// Ironwood pool (NU6.3, July 2026). See docs/06-problems-and-fixes.md, P-07, and ADR-013.
import { verdict, checksumFailed, MODEL, TEXT } from '../model.js';

const ZEC_T1 = [0x1c, 0xb8];
const ZEC_T3 = [0x1c, 0xbd];
const ZEC_TESTNET_TM = [0x1d, 0x25];

/**
 * Rate a decoded Base58Check payload of 22 bytes (2-byte prefix + 20-byte hash).
 * @param {Uint8Array} payload
 * @returns {import('../model.js').Verdict | null}
 */
export function zcashTransparentVerdict(payload) {
  const p = [payload[0], payload[1]];
  if (p[0] === ZEC_T1[0] && p[1] === ZEC_T1[1]) return verdict('zec', 'Zcash transparent (t1)', MODEL.HIDDEN_UNTIL_USED, 'This works like a Bitcoin legacy address. ' + TEXT.SEGWIT_HIDDEN);
  if (p[0] === ZEC_T3[0] && p[1] === ZEC_T3[1]) return verdict('zec', 'Zcash transparent script (t3)', MODEL.HIDDEN_UNTIL_USED, TEXT.SCRIPT_HIDDEN);
  if (p[0] === ZEC_TESTNET_TM[0] && p[1] === ZEC_TESTNET_TM[1]) return verdict(null, 'Zcash test address', MODEL.UNKNOWN, TEXT.TESTNET);
  return null;
}

/**
 * @param {import('../core/bech32.js').Bech32Result} dec
 * @returns {import('../model.js').Verdict | null}
 */
export function zcashBech32Verdict(dec) {
  if (dec.hrp === 'tex' && dec.spec !== 'bech32m') return checksumFailed('a Zcash TEX address (the encoding does not match)');
  if (dec.hrp === 'zs' && dec.spec !== 'bech32') return checksumFailed('a Zcash Sapling address (the encoding does not match)');
  if (dec.hrp === 'u' && dec.spec !== 'bech32m') return checksumFailed('a Zcash unified address (the encoding does not match)');
  if (dec.hrp === 'tex') {
    return verdict('zec', 'Zcash TEX address', MODEL.HIDDEN_UNTIL_USED, 'A transparent-only Zcash address. ' + TEXT.SEGWIT_HIDDEN, { noLink: true });
  }
  if (dec.hrp === 'zs') {
    return verdict('zec', 'Zcash Sapling shielded address', MODEL.MOVE_POOL,
      'Zcash research says that someone who can break its curve math could steal or counterfeit funds in the Sapling pool. Sapling has no recovery path. Zcash plans to stop Sapling if that threat becomes real.',
      { noLink: true, moveText: 'Move shielded funds into the Ironwood pool, which supports quantum-recoverable notes. Use the migration feature of your wallet and start with a small amount.' });
  }
  if (dec.hrp === 'u') {
    return verdict('zec', 'Zcash unified address', MODEL.ASK_PROVIDER,
      'A unified address can receive into more than one shielded pool. The risk depends on the pool that holds the funds, not on the address.',
      { noLink: true, pill: 'Check your pool',
        askText: 'Open your Zcash wallet and find the pool that holds the balance. Sapling funds have no quantum recovery path, and Orchard now only allows withdrawals. Move both into Ironwood, which supports quantum-recoverable notes.' });
  }
  return null;
}
