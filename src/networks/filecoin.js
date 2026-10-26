// @ts-check
// Filecoin addresses: f0 (ID), f1 (secp256k1 hash), f2 (actor), f3 (BLS key), f4 (f410f = EVM account).
// f1, f2, f3 and f410 carry a 4-byte BLAKE2b checksum over the protocol byte, the namespace (f4) and the payload.
import { verdict, checksumFailed, MODEL, TEXT } from '../model.js';
import { EVM_NETWORKS } from '../chains.js';
import { base32Decode } from '../core/base32.js';
import { blake2b } from '../core/blake2b.js';
import { bytesEqual } from '../core/bytes.js';

/**
 * @param {string} s
 * @returns {{ proto: number, net: string } | null}
 */
function filecoinDecode(s) {
  if (s.length > 120) return null;
  if (/^[ft]410f[a-z2-7]{39}$/.test(s)) {
    // f4: protocol 4, namespace 10 (the EVM address manager), 20-byte payload, 4-byte checksum.
    const raw = base32Decode(s.slice(5));
    if (!raw || raw.length !== 24) return null;
    if (!bytesEqual(blake2b(Uint8Array.from([4, 10, ...raw.slice(0, 20)]), 4), raw.slice(20))) return null;
    return { proto: 4, net: s[0] };
  }
  const m = /^([ft])([0-3])([a-z2-7]+|\d+)$/.exec(s);
  if (!m) return null;
  const proto = Number(m[2]);
  if (proto === 0) return /^\d{1,20}$/.test(m[3]) ? { proto, net: m[1] } : null;
  const raw = base32Decode(m[3]);
  if (!raw || raw.length < 5) return null;
  const payload = raw.slice(0, -4);
  if (!bytesEqual(blake2b(Uint8Array.from([proto, ...payload]), 4), raw.slice(-4))) return null;
  if ((proto === 1 || proto === 2) && payload.length !== 20) return null;
  if (proto === 3 && payload.length !== 48) return null;
  return { proto, net: m[1] };
}

/**
 * @param {string} a
 * @returns {import('../model.js').Verdict | null}
 */
export function detectFilecoin(a) {
  const f = filecoinDecode(a);
  if (!f) {
    if (/^[ft][1-3][a-z2-7]{20,}$|^[ft]410f[a-z2-7]{39}$/.test(a)) return checksumFailed('a Filecoin address');
    return null;
  }
  if (f.net === 't') return verdict(null, 'Filecoin test address', MODEL.UNKNOWN, TEXT.TESTNET);
  switch (f.proto) {
    case 1: return verdict('fil', 'Filecoin account (f1)', MODEL.HIDDEN_UNTIL_USED, TEXT.HASH_HIDDEN);
    case 2: return verdict(null, 'Filecoin actor (f2)', MODEL.UNKNOWN, 'This is a contract or multisig actor. Examine the accounts that control it.');
    case 3: return verdict('fil', 'Filecoin BLS account (f3)', MODEL.VISIBLE, 'An f3 address is a BLS public key.');
    case 4: return verdict('evm', 'Filecoin EVM account (f4)', MODEL.HIDDEN_UNTIL_USED,
      'An f410 address is an Ethereum-style account in Filecoin format. It uses the same key as the matching 0x address.',
      { networks: EVM_NETWORKS, noLink: true, chainLabel: 'Filecoin (EVM)' });
    default: return verdict(null, 'Filecoin ID address (f0)', MODEL.UNKNOWN, 'This is a short ID. Find the full f1, f3 or f4 address that it points to.');
  }
}
