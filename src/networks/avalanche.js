// @ts-check
// Avalanche X-Chain and P-Chain addresses written with a chain prefix: "X-avax1..." or "P-avax1...".
// The C-Chain uses normal 0x addresses (see evm.js). The P-Chain is where AVAX is staked.
import { verdict, checksumFailed, MODEL, TEXT } from '../model.js';
import { bech32Decode } from '../core/bech32.js';

/**
 * @param {string} a
 * @returns {import('../model.js').Verdict | null}
 */
export function detectAvalancheChainPrefixed(a) {
  if (!/^[XP]-avax1/i.test(a)) return null;
  const inner = bech32Decode(a.slice(2).toLowerCase(), 90);
  if (!inner || inner.hrp !== 'avax') return checksumFailed('an Avalanche address');
  const isP = /^P-/i.test(a);
  const chain = isP ? 'P-Chain (staking)' : 'X-Chain';
  return verdict('avax', 'Avalanche ' + chain, MODEL.HIDDEN_UNTIL_USED, TEXT.HASH_HIDDEN, {
    chainLabel: 'Avalanche ' + chain,
    explorer: isP ? 'https://avascan.info/blockchain/p/address/{a}' : null,
  });
}
