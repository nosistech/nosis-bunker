// @ts-check
// Base58 formats, sorted by decoded length:
// 25 bytes: Bitcoin, Litecoin, Dogecoin, Tron, Dash, Ravencoin, Neo (version byte + 20-byte hash + checksum)
// 26 bytes: Zcash transparent, 27 bytes: Tezos, 32 bytes: Solana, B62: Mina.
import { verdict, checksumFailed, MODEL, TEXT } from '../model.js';
import { base58Decode, base58CheckDecode } from '../core/base58.js';
import { zcashTransparentVerdict } from './zcash.js';

/** version byte: [chain, type, model, why] */
const BASE58_VERSIONS = Object.freeze({
  0x00: ['btc', 'Legacy (1...)', MODEL.HIDDEN_UNTIL_USED, TEXT.SEGWIT_HIDDEN],
  0x05: ['btc', 'Nested SegWit or script (3...)', MODEL.HIDDEN_UNTIL_USED, 'Only a hash is on chain. The key appears the first time this address spends.'],
  0x30: ['ltc', 'Legacy (L...)', MODEL.HIDDEN_UNTIL_USED, TEXT.SEGWIT_HIDDEN],
  0x32: ['ltc', 'Script hash (M...)', MODEL.HIDDEN_UNTIL_USED, TEXT.SCRIPT_HIDDEN],
  0x1e: ['doge', 'Legacy (D...)', MODEL.HIDDEN_UNTIL_USED, TEXT.SEGWIT_HIDDEN + ' DigiByte legacy addresses use the same format.'],
  0x16: ['doge', 'Script hash', MODEL.HIDDEN_UNTIL_USED, TEXT.SCRIPT_HIDDEN],
  0x41: ['tron', 'Tron account', MODEL.HIDDEN_UNTIL_USED, TEXT.HASH_HIDDEN],
  0x4c: ['dash', 'Dash address', MODEL.HIDDEN_UNTIL_USED, TEXT.SEGWIT_HIDDEN],
  0x10: ['dash', 'Dash script address', MODEL.HIDDEN_UNTIL_USED, TEXT.SCRIPT_HIDDEN],
  0x3c: ['rvn', 'Ravencoin address', MODEL.HIDDEN_UNTIL_USED, TEXT.SEGWIT_HIDDEN],
  0x35: ['neo', 'Neo N3 account', MODEL.HIDDEN_UNTIL_USED, 'The address is a hash of the script that holds the key. The key stays hidden until the account sends.'],
  0x3f: ['dgb', 'DigiByte script address', MODEL.HIDDEN_UNTIL_USED, TEXT.SCRIPT_HIDDEN],
  0x6f: [null, 'Test network address', MODEL.UNKNOWN, TEXT.TESTNET],
  0xc4: [null, 'Test network address', MODEL.UNKNOWN, TEXT.TESTNET],
});

/** Tezos 3-byte prefixes. */
const TEZOS_PREFIXES = Object.freeze({ tz1: [6, 161, 159], tz2: [6, 161, 161], tz3: [6, 161, 164], tz4: [6, 161, 166], KT1: [2, 90, 121] });

/**
 * @param {Uint8Array} p decoded payload
 * @returns {import('../model.js').Verdict | null}
 */
function tezosVerdict(p) {
  for (const [name, pre] of Object.entries(TEZOS_PREFIXES)) {
    if (p[0] !== pre[0] || p[1] !== pre[1] || p[2] !== pre[2]) continue;
    if (name === 'KT1') return verdict(null, 'Tezos contract (KT1)', MODEL.UNKNOWN, 'A contract has no key of its own. Examine the accounts that control it.');
    return verdict('xtz', 'Tezos account (' + name + ')', MODEL.HIDDEN_UNTIL_USED,
      'The address is a hash of the key. Tezos publishes the key with a "reveal" operation on the first send.');
  }
  return null;
}

/**
 * @param {string} a
 * @returns {import('../model.js').Verdict | null}
 */
export function detectBase58(a) {
  if (a.length > 120) return null;
  const raw = base58Decode(a);
  if (!raw) return null;
  if (raw.length === 25) {
    const p = base58CheckDecode(a);
    if (!p) return checksumFailed('a Bitcoin-style address');
    const v = BASE58_VERSIONS[p[0]];
    if (!v) return verdict(null, 'Unknown Base58 address', MODEL.UNKNOWN, 'The checksum is valid, but this tool does not know this network yet.');
    return verdict(v[0], v[1], v[2], v[3]);
  }
  if (raw.length === 26) {
    const p = base58CheckDecode(a);
    const z = p ? zcashTransparentVerdict(p) : null;
    if (z) return z;
  }
  if (raw.length === 27) {
    const p = base58CheckDecode(a);
    const t = p ? tezosVerdict(p) : null;
    if (t) return t;
  }
  if (/^B62/.test(a)) {
    const p = base58CheckDecode(a);
    if (p && p[0] === 0xcb) return verdict('mina', 'Mina account', MODEL.VISIBLE, 'A Mina address is the public key.');
  }
  if (raw.length === 32 && a.length >= 32 && a.length <= 44) {
    return verdict('sol', 'Solana account', MODEL.VISIBLE, 'A Solana address is the public key. A fresh address does not hide it.');
  }
  if ((raw.length === 35 || raw.length === 36) && a.length >= 46 && a.length <= 50) {
    return checksumFailed('a Polkadot-style address');
  }
  return null;
}
