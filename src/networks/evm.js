// @ts-check
// Ethereum and every EVM network. One key, one address, many networks.
// Ronin and XDC write the same address with their own prefix.
import { verdict, checksumFailed, MODEL } from '../model.js';
import { EVM_NETWORKS, EVM_TOKENS } from '../chains.js';
import { keccak256 } from '../core/keccak256.js';
import { utf8 } from '../core/bytes.js';

const EVM_WHY = 'The key stays hidden until the first transaction or signed message from this address. One address covers every EVM network.';

/**
 * EIP-55 mixed-case checksum. All-lowercase or all-uppercase addresses carry no checksum.
 * @param {string} addr 0x + 40 hex characters
 * @returns {boolean}
 */
export function eip55Valid(addr) {
  const hex = addr.slice(2);
  if (hex === hex.toLowerCase() || hex === hex.toUpperCase()) return true;
  const hash = keccak256(utf8(hex.toLowerCase()));
  for (let i = 0; i < 40; i++) {
    const nibble = (hash[i >> 1] >> (i % 2 ? 0 : 4)) & 15;
    const ch = hex[i];
    if (/[a-f]/.test(ch) && nibble >= 8) return false;
    if (/[A-F]/.test(ch) && nibble < 8) return false;
  }
  return true;
}

/**
 * @param {string} a
 * @returns {import('../model.js').Verdict | null}
 */
export function detectEvm(a) {
  if (/^0x[0-9a-fA-F]{40}$/.test(a)) {
    if (!eip55Valid(a)) return checksumFailed('an Ethereum-style address (the capital letters do not match)');
    return verdict('evm', 'EVM account', MODEL.HIDDEN_UNTIL_USED, EVM_WHY, { networks: EVM_NETWORKS, tokens: EVM_TOKENS });
  }
  if (/^ronin:[0-9a-fA-F]{40}$/i.test(a)) {
    if (!eip55Valid('0x' + a.slice(6))) return checksumFailed('an Ethereum-style address (the capital letters do not match)');
    return verdict('evm', 'Ronin account', MODEL.HIDDEN_UNTIL_USED,
      'Ronin writes an Ethereum-style address with its own prefix. The key and the rules are the same as any EVM account.',
      { networks: EVM_NETWORKS, explorer: 'https://app.roninchain.com/address/{a}', chainLabel: 'Ronin (EVM)' });
  }
  if (/^xdc[0-9a-fA-F]{40}$/i.test(a)) {
    if (!eip55Valid('0x' + a.slice(3))) return checksumFailed('an Ethereum-style address (the capital letters do not match)');
    return verdict('evm', 'XDC account', MODEL.HIDDEN_UNTIL_USED,
      'XDC writes an Ethereum-style address with its own prefix. The key and the rules are the same as any EVM account.',
      { networks: EVM_NETWORKS, explorer: 'https://xdcscan.com/address/{a}', chainLabel: 'XDC Network (EVM)' });
  }
  return null;
}
