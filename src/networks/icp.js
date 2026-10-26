// @ts-check
// Internet Computer: account identifiers (64 hex) and principals (dash-separated Base32).
// Both carry a CRC-32 checksum. The secret guard uses icpAccountValid so that an account ID
// is not mistaken for a private key. See docs/06-problems-and-fixes.md, P-04.
import { verdict, MODEL } from '../model.js';
import { crc32 } from '../core/crc32.js';
import { base32Decode } from '../core/base32.js';
import { hexToBytes, readUint32BE } from '../core/bytes.js';

const ICP_KIND_OPAQUE = 1;      // canisters (smart contracts)
const ICP_KIND_SELF_AUTH = 2;   // users: a hash of the public key

/**
 * True when 64 hex characters are a valid ICP account identifier (CRC-32 of the last 28 bytes).
 * @param {string} hex
 * @returns {boolean}
 */
export function icpAccountValid(hex) {
  if (!/^[0-9a-fA-F]{64}$/.test(hex)) return false;
  const b = hexToBytes(hex);
  return crc32(b.slice(4)) === readUint32BE(b, 0);
}

/**
 * @param {string} s
 * @returns {{ kind: number } | null}
 */
function icpPrincipalDecode(s) {
  if (s.length < 8 || s.length > 70 || !/^([a-z2-7]{5}-)*[a-z2-7]{1,5}$/.test(s)) return null;
  const raw = base32Decode(s.replace(/-/g, ''));
  if (!raw || raw.length < 4) return null;
  const body = raw.slice(4);
  if (crc32(body) !== readUint32BE(raw, 0)) return null;
  return { kind: body.length ? body[body.length - 1] : 0 };
}

/**
 * @param {string} a
 * @returns {import('../model.js').Verdict | null}
 */
export function detectIcp(a) {
  if (/^[0-9a-f]{64}$/.test(a) && icpAccountValid(a)) {
    return verdict('icp', 'ICP account identifier', MODEL.HIDDEN_UNTIL_USED,
      'An account identifier is a hash. The key behind it appears when its owner signs.',
      { explorer: 'https://dashboard.internetcomputer.org/account/{a}' });
  }
  const p = icpPrincipalDecode(a);
  if (!p) return null;
  if (p.kind === ICP_KIND_SELF_AUTH) {
    return verdict('icp', 'ICP principal (user)', MODEL.HIDDEN_UNTIL_USED,
      'A user principal is a hash of the public key. The key appears when its owner signs.');
  }
  if (p.kind === ICP_KIND_OPAQUE) {
    return verdict(null, 'ICP canister', MODEL.UNKNOWN, 'A canister is a smart contract with no key of its own. Examine the principals that control it.');
  }
  return verdict(null, 'ICP principal', MODEL.UNKNOWN, 'This is a system or anonymous principal. There is nothing to rate.');
}
