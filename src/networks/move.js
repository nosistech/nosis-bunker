// @ts-check
// Hex addresses that are not 40 characters: Flow, Move networks (Sui, Aptos, IOTA) and Starknet.
// A 64-character address can belong to four networks, so the user picks one. See ADR-011.
import { verdict, MODEL } from '../model.js';

/**
 * @param {string} a
 * @returns {import('../model.js').Verdict | null}
 */
export function detectMoveOrStarknet(a) {
  if (/^0x[0-9a-fA-F]{16}$/.test(a)) {
    return verdict('flow', 'Flow account', MODEL.VISIBLE,
      'Flow stores account keys in public on chain. You can change the keys without moving funds.');
  }
  if (/^0x[0-9a-fA-F]{64}$/.test(a)) {
    // Starknet addresses are below 2^251 (0x08 followed by 62 zeros). In the 64-digit form,
    // the first hex digit is 0 and the second is 0 to 7 (P-44).
    const starknetPossible = a[2] === '0' && parseInt(a[3], 16) <= 7;
    const options = starknetPossible ? ['sui', 'aptos', 'iota', 'starknet'] : ['sui', 'aptos', 'iota'];
    return verdict('sui', 'Move or Starknet account', MODEL.HIDDEN_UNTIL_USED,
      'The address comes from a hash, so the key stays hidden until the first transaction. Select the network below.',
      { options });
  }
  // A 63-digit value that starts with 8 to f is 2^251 or more, so it cannot be a Starknet address (P-44).
  if (/^0x[0-9a-fA-F]{43,63}$/.test(a) && !(a.length === 65 && parseInt(a[2], 16) > 7)) {
    return verdict('starknet', 'Starknet account', MODEL.HIDDEN_UNTIL_USED,
      'The address comes from a hash. The key stays hidden until the first transaction deploys the account. Starknet accounts can change their key.');
  }
  return null;
}
