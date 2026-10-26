// @ts-check
// Canton Network party IDs: "hint::1220" + 64 hex (a hash of the namespace key).
// Canton is permissioned. The key is shared with the nodes on its synchronizer, so we do not rate it.
// We tell the user what to ask the provider. See docs/decisions/ADR-012-permissioned-networks.md.
import { verdict, MODEL } from '../model.js';

/**
 * @param {string} a
 * @returns {import('../model.js').Verdict | null}
 */
export function detectCanton(a) {
  if (!/^[A-Za-z0-9_.-]{1,185}::1220[0-9a-f]{64}$/.test(a)) return null;
  return verdict('canton', 'Canton party ID', MODEL.ASK_PROVIDER,
    'The party ID ends in a hash of its namespace key. The key itself is shared with the nodes on its synchronizer. Who can see it depends on the network operators.',
    { askText: 'Ask your validator, custodian or node operator who can read the keys of this party, and if the network can change to new keys.' });
}
