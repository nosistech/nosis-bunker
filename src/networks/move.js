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
    // Starknet addresses are field elements below 2^251, so the first hex digit is 0 to 7.
    const starknetPossible = parseInt(a[2], 16) <= 7;
    const options = starknetPossible ? ['sui', 'aptos', 'iota', 'starknet'] : ['sui', 'aptos', 'iota'];
    return verdict('sui', 'Move or Starknet account', MODEL.HIDDEN_UNTIL_USED,
      'The address comes from a hash, so the key stays hidden until the first transaction. Select the network below.',
      { options });
  }
  if (/^0x[0-9a-fA-F]{43,63}$/.test(a)) {
    return verdict('starknet', 'Starknet account', MODEL.HIDDEN_UNTIL_USED,
      'The address comes from a hash. The key stays hidden until the first transaction deploys the account. Starknet accounts can change their key.');
  }
  return null;
}
