// @ts-check
// One Bech32 decode, then a dispatch by prefix (HRP). Each family module answers or returns null.
// Order inside this file: Bitcoin family, Zcash, Cardano, Cosmos, other networks, test networks, then unknown.
import { verdict, checksumFailed, MODEL, TEXT } from '../model.js';
import { EVM_NETWORKS } from '../chains.js';
import { bech32Decode } from '../core/bech32.js';
import { bitcoinBech32Verdict } from './bitcoin.js';
import { zcashBech32Verdict } from './zcash.js';
import { cardanoVerdict } from './cardano.js';
import { cosmosVerdict } from './cosmos.js';

const TEST_HRPS = ['tb', 'bcrt', 'tltc', 'ert', 'tlq', 'tsp', 'tark', 'sparkrt', 'sparkt', 'sprt', 'textest', 'utest', 'ztestsapling', 'addr_test', 'stake_test'];

/** Simple one-line rules: prefix -> [chain, type, model, why, extra] */
const BECH32_RULES = Object.freeze({
  spark: ['spark', 'Spark address', MODEL.VISIBLE, 'A Spark address contains the identity public key of the wallet, so the lock is visible from day one.'],
  ark: ['ark', 'Ark address', MODEL.VISIBLE, 'An Ark address contains public keys, including the key of the owner.'],
  ltcmweb: ['ltc', 'Litecoin MWEB address', MODEL.VISIBLE, 'An MWEB address contains its scan and spend public keys.', { noLink: true }],
  npub: ['nostr', 'Nostr public key', MODEL.VISIBLE, 'This is a Nostr identity key on the same curve as Bitcoin. It holds no funds. Do not use it as a wallet key.'],
  erd: ['egld', 'MultiversX account', MODEL.VISIBLE, 'A MultiversX address is the public key.'],
  one: ['evm', 'Harmony account', MODEL.HIDDEN_UNTIL_USED, 'Harmony writes an Ethereum-style address in its own format. The key and the rules are the same as any EVM account.',
    { networks: EVM_NETWORKS, explorer: 'https://explorer.harmony.one/address/{a}', chainLabel: 'Harmony (EVM)' }],
  iota: ['iota', 'IOTA address (legacy format)', MODEL.HIDDEN_UNTIL_USED, 'The address is a hash of the key. The key stays hidden until it sends.'],
  avax: ['avax', 'Avalanche X or P-Chain', MODEL.HIDDEN_UNTIL_USED, TEXT.HASH_HIDDEN],
  oasis: ['hashacct', 'Oasis account', MODEL.HIDDEN_UNTIL_USED, TEXT.HASH_HIDDEN, { chainLabel: 'Oasis' }],
  zil: ['hashacct', 'Zilliqa account', MODEL.HIDDEN_UNTIL_USED, TEXT.HASH_HIDDEN, { chainLabel: 'Zilliqa' }],
  account_rdx: ['hashacct', 'Radix account', MODEL.HIDDEN_UNTIL_USED, TEXT.HASH_HIDDEN, { chainLabel: 'Radix' }],
  ckb: ['hashacct', 'Nervos CKB account', MODEL.HIDDEN_UNTIL_USED, TEXT.HASH_HIDDEN, { chainLabel: 'Nervos CKB' }],
});

/**
 * @param {string} a
 * @returns {import('../model.js').Verdict | null}
 */
export function detectBech32(a) {
  const dec = bech32Decode(a, 1023);
  if (!dec) {
    // The shape of a Bech32 address with a wrong checksum. It must not fall through to the
    // Base58 detector, where a 43-character string can pass as a Solana address (P-37).
    const shape = /^[a-z_]{1,83}1[qpzry9x8gf2tvdw0s3jn54khce6mua7l]{6,}$/;
    if (a.length <= 1023 && (shape.test(a) || shape.test(a.toLowerCase()) && a === a.toUpperCase())) return checksumFailed('a Bech32 address');
    return null;
  }
  const family = bitcoinBech32Verdict(dec) || zcashBech32Verdict(dec) || cardanoVerdict(dec) || cosmosVerdict(dec.hrp);
  if (family) return family;
  // Spark used "sp" before it moved to "spark". Silent Payments (version q) were handled above.
  const hrp = dec.hrp === 'sp' ? 'spark' : dec.hrp;
  if (Object.prototype.hasOwnProperty.call(BECH32_RULES, hrp)) {
    const [chain, type, model, why, extra] = BECH32_RULES[hrp];
    return verdict(chain, type, model, why, extra);
  }
  if (TEST_HRPS.includes(dec.hrp)) return verdict(null, 'Test network address', MODEL.UNKNOWN, TEXT.TESTNET);
  return verdict(null, 'Unknown Bech32 address (' + dec.hrp.slice(0, 20) + ')', MODEL.UNKNOWN,
    'The format is valid, but this tool does not know this network yet.');
}
