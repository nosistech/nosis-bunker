// @ts-check
// Stacks (Bitcoin layer). SP = single key, SM = multisig. ST and SN are test network versions.
import { verdict, MODEL, TEXT } from '../model.js';
import { c32CheckDecode } from '../core/c32.js';

const STACKS_TESTNET_VERSIONS = [26, 21];
const STACKS_MULTISIG_VERSION = 20;

/**
 * @param {string} a
 * @returns {import('../model.js').Verdict | null}
 */
export function detectStacks(a) {
  const r = c32CheckDecode(a);
  if (!r) return null;
  if (STACKS_TESTNET_VERSIONS.includes(r.version)) return verdict(null, 'Stacks test address', MODEL.UNKNOWN, TEXT.TESTNET);
  return verdict('stx', r.version === STACKS_MULTISIG_VERSION ? 'Stacks multisig' : 'Stacks account', MODEL.HIDDEN_UNTIL_USED,
    'The address is a hash of the key. The key stays hidden until the account sends. Stacks keys use the same curve as Bitcoin.');
}
