// @ts-check
// Liquid confidential addresses (lq1). Layout after the witness version:
// 33-byte blinding key + witness program (20 bytes for a key hash, 32 bytes for a script or Taproot).
// The blinding key only hides amounts. It does not control funds.
import { verdict, checksumFailed, MODEL, TEXT } from '../model.js';
import { blech32Decode } from '../core/blech32.js';
import { convertBits } from '../core/bech32.js';

const BLINDING_KEY_BYTES = 33;
const BLIND_NOTE = ' The blinding key inside only hides amounts. It does not control funds.';

/**
 * @param {string} a
 * @returns {import('../model.js').Verdict | null}
 */
export function detectLiquidConfidential(a) {
  if (!/^(lq1|tlq1)[02-9ac-hj-np-z]{80,130}$/i.test(a)) return null;
  const d = blech32Decode(a);
  if (!d) return checksumFailed('a Liquid confidential address');
  if (d.hrp !== 'lq') return verdict(null, 'Liquid test address', MODEL.UNKNOWN, TEXT.TESTNET);
  const version = d.data[0];
  const prog = convertBits(d.data.slice(1), 5, 8, false);
  if (!prog || (version === 0) !== (d.spec === 'blech32')) return checksumFailed('a Liquid confidential address (the version does not match the encoding)');
  const programLength = prog.length - BLINDING_KEY_BYTES;
  if (version === 1 && programLength === 32) return verdict('liquid', 'Liquid confidential Taproot', MODEL.VISIBLE, 'Taproot puts the public key in the address.' + BLIND_NOTE);
  if (version === 0 && programLength === 20) return verdict('liquid', 'Liquid confidential address', MODEL.HIDDEN_UNTIL_USED, TEXT.SEGWIT_HIDDEN + BLIND_NOTE);
  if (version === 0 && programLength === 32) return verdict('liquid', 'Liquid confidential script', MODEL.HIDDEN_UNTIL_USED, TEXT.SCRIPT_HIDDEN + BLIND_NOTE);
  return verdict('liquid', 'Liquid confidential address', MODEL.HIDDEN_UNTIL_USED, 'This witness version is new to this tool. Treat it as hidden until it spends.' + BLIND_NOTE);
}
