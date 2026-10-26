// @ts-check
// Account formats with their own text encodings: NEAR, Hedera, Stellar, Algorand, TON and XRP.
// Stellar, Algorand, TON and XRP carry checksums. We verify them. See docs/06-problems-and-fixes.md, P-19.
import { verdict, checksumFailed, MODEL, TEXT } from '../model.js';
import { base32Decode } from '../core/base32.js';
import { base58CheckDecode, BASE58_ALPHABET } from '../core/base58.js';
import { base64Decode } from '../core/base64.js';
import { crc16Xmodem } from '../core/crc16.js';
import { sha512t256 } from '../core/sha512.js';
import { bytesEqual } from '../core/bytes.js';

const RIPPLE_ALPHABET = 'rpshnaf39wBUDNEGHJKLM4PQRST7VWXYZ2bcdeCg65jkm8oFqi1tuvAxyz';
const STELLAR_ACCOUNT = 6 << 3;   // "G..."
const STELLAR_MUXED = 12 << 3;    // "M..."
const TON_TAGS = [0x11, 0x51, 0x91, 0xd1]; // bounceable, non-bounceable, and their test-network forms

/**
 * Stellar StrKey: version byte + payload + CRC-16 (little-endian).
 * @param {string} a @param {number} version @param {number} payloadLength
 */
function stellarValid(a, version, payloadLength) {
  const raw = base32Decode(a);
  if (!raw || raw.length !== 1 + payloadLength + 2 || raw[0] !== version) return false;
  const crc = crc16Xmodem(raw.slice(0, -2));
  return raw[raw.length - 2] === (crc & 255) && raw[raw.length - 1] === (crc >> 8);
}

/** Algorand: 32-byte key + last 4 bytes of SHA-512/256(key). @param {string} a */
function algorandValid(a) {
  const raw = base32Decode(a);
  if (!raw || raw.length !== 36) return false;
  return bytesEqual(sha512t256(raw.slice(0, 32)).slice(-4), raw.slice(32));
}

/** TON user-friendly address: tag + workchain + 32-byte hash + CRC-16 (big-endian). @param {string} a */
function tonValid(a) {
  const raw = base64Decode(a);
  if (!raw || raw.length !== 36 || !TON_TAGS.includes(raw[0])) return false;
  const crc = crc16Xmodem(raw.slice(0, 34));
  return raw[34] === (crc >> 8) && raw[35] === (crc & 255);
}

/** XRP: Base58Check with the Ripple alphabet, version 0, 20-byte hash. @param {string} a */
function xrpValid(a) {
  let mapped = '';
  for (const ch of a) {
    const i = RIPPLE_ALPHABET.indexOf(ch);
    if (i < 0) return false;
    mapped += BASE58_ALPHABET[i];
  }
  const p = base58CheckDecode(mapped);
  return !!p && p.length === 21 && p[0] === 0;
}

/**
 * @param {string} a
 * @returns {import('../model.js').Verdict | null}
 */
export function detectTextAccount(a) {
  if (/^[a-z0-9_-]{1,64}(\.[a-z0-9_-]{1,64}){0,4}\.(near|tg)$/.test(a)) {
    return verdict('near', 'NEAR named account', MODEL.VISIBLE, 'NEAR stores access keys in public on chain.');
  }
  if (/^near:[0-9a-f]{64}$/.test(a)) {
    return verdict('near', 'NEAR implicit account', MODEL.VISIBLE, 'A NEAR implicit account is the public key written in hex.', { address: a.slice(5) });
  }
  if (/^0\.0\.\d{1,12}(-[a-z]{5})?$/.test(a)) {
    return verdict('hbar', 'Hedera account', MODEL.VISIBLE, 'Hedera stores account keys in public on the ledger. You can change the keys without moving funds.');
  }
  if (/^G[A-Z2-7]{55}$/.test(a)) {
    if (!stellarValid(a, STELLAR_ACCOUNT, 32)) return checksumFailed('a Stellar address');
    return verdict('xlm', 'Stellar account', MODEL.VISIBLE, 'A Stellar address is the public key.');
  }
  if (/^M[A-Z2-7]{68}$/.test(a)) {
    if (!stellarValid(a, STELLAR_MUXED, 40)) return checksumFailed('a Stellar muxed address');
    return verdict('xlm', 'Stellar muxed account', MODEL.VISIBLE, 'A muxed Stellar address contains the public key.');
  }
  if (/^[A-Z2-7]{58}$/.test(a)) {
    if (!algorandValid(a)) return checksumFailed('an Algorand address');
    return verdict('algo', 'Algorand account', MODEL.VISIBLE, 'An Algorand address is the public key. Rekeying changes the key without moving funds.');
  }
  if (/^(EQ|UQ|Ef|Uf|kQ|0Q)[A-Za-z0-9_+/-]{46}$/.test(a)) {
    if (!tonValid(a)) return checksumFailed('a TON address');
    // Tags 0x91 and 0xd1 (the kQ and 0Q forms) are the test network.
    if (/^(kQ|0Q)/.test(a)) return verdict(null, 'TON test address', MODEL.UNKNOWN, TEXT.TESTNET);
    return verdict('ton', 'TON wallet', MODEL.HIDDEN_UNTIL_USED, 'The key stays hidden until the wallet sends for the first time.');
  }
  if (/^-?[01]:[0-9a-fA-F]{64}$/.test(a)) {
    return verdict('ton', 'TON wallet (raw form)', MODEL.HIDDEN_UNTIL_USED, 'The key stays hidden until the wallet sends for the first time.');
  }
  if (/^r[1-9A-HJ-NP-Za-km-z]{24,34}$/.test(a)) {
    if (!xrpValid(a)) return checksumFailed('an XRP address');
    return verdict('xrp', 'XRP account', MODEL.HIDDEN_UNTIL_USED, TEXT.HASH_HIDDEN);
  }
  return null;
}
