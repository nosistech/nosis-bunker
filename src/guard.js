// @ts-check
// The secret guard. It looks for seed phrases and private keys BEFORE any address is classified.
// If it finds one, the page clears the input and explains why. See ADR-010.
// The guard never sends or stores the secret. It only returns a short description.
import { base58Decode, base58CheckDecode } from './core/base58.js';
import { icpAccountValid } from './networks/icp.js';

// A seed word in any BIP-39 list: 3 to 8 letters (Latin lists, with accents in the Spanish, French,
// Italian, Portuguese and Czech lists), one Chinese character, or 2 to 6 kana or Hangul syllables.
const SEED_WORD = /^(\p{L}{3,8}|[一-鿿]|[぀-ヿ가-힯]{2,6})$/u;
// List numbering that people type before each seed word: "1.", "2)", "12:", "#3".
const NUMBERING = /^#?\d{1,2}[.):-]?$/;
// Invisible format characters (zero-width spaces, soft hyphens, direction marks) are removed first.
const INVISIBLE = /\p{Cf}/gu;
// The guard splits on whitespace and on the punctuation of JSON, shell and config files, so a key
// inside quotes, brackets or after "=" is still one token.
const SPLIT = /[\s,;="'`[\]{}()<>]+|\.(?=\s|$)/;
// Numbering glued to a word: "1.abandon", "2)ability".
const GLUED_NUMBER = /^#?\d{1,2}[.):-](?=\p{L})/u;
const RIPPLE = '[rpshnaf39wBUDNEGHJKLM4PQRST7VWXYZ2bcdeCg65jkm8oFqi1tuvAxyz]';
const XRP_SEED = new RegExp('^s' + RIPPLE + '{28,31}$');

/**
 * @param {string} t one token from the input
 * @returns {string | null} a description of the secret, or null
 */
function secretInToken(t) {
  if (t.length > 4000) return null;
  if (/^(xprv|yprv|zprv|tprv|uprv|vprv|Yprv|Zprv|Ltpv|Mtpv|dgpv)[1-9A-HJ-NP-Za-km-z]{90,120}$/.test(t)) return 'an extended private key';
  if (/^[0-9a-fA-F]{64}$/.test(t) && !icpAccountValid(t)) return 'a raw private key, or an address without its prefix';
  if (/^[0-9a-fA-F]{128}$/.test(t)) return 'a raw private key';
  if (/^[0-9a-fA-F]{64}01$/.test(t) && !/^0[23]/.test(t)) return 'a Stacks private key';
  // DER: SEQUENCE (short or long length) then INTEGER 0 or 1 (the key version).
  if (/^30(?:[0-7][0-9a-f]|81[0-9a-f]{2}|82[0-9a-f]{4})02010[01]/i.test(t) && /^[0-9a-fA-F]{90,800}$/.test(t)) return 'a DER-encoded private key';
  // PKCS#8 or SEC1 key bodies in Base64 start with these bytes.
  if (/^(MII[A-Za-z0-9+/]{30,}|MC4CAQAwBQYDK2Vw|MHQCAQEEI|MIGHAgEAMBMGByqGSM49|MIGEAgEAMBAGByqGSM49)/.test(t) && t.length >= 40) return 'a PEM private key';
  if (/^58(20|40|80)[0-9a-fA-F]{64,256}$/.test(t)) return 'a Cardano private key';
  if (/^S[A-Z2-7]{55}$/.test(t)) return 'a Stellar secret key';
  if (XRP_SEED.test(t)) return 'an XRP secret key';
  if (/^nsec1/i.test(t)) return 'a Nostr private key';
  if (/^(suiprivkey|ed25519-priv|secp256k1-priv|secp256r1-priv)/i.test(t)) return 'a private key';
  // NEAR credential files: "ed25519:" + a Base58 64-byte key. A public key in that format is only 32 bytes.
  if (/^(ed25519|secp256k1):[1-9A-HJ-NP-Za-km-z]{80,100}$/.test(t)) return 'a private key';
  if (/^(addr_xsk|addr_sk|acct_xsk|acct_sk|root_xsk|stake_sk|stake_xsk|ed25519_sk|ed25519e_sk)1/.test(t)) return 'a Cardano private key';
  if (/^(edsk|spsk|p2sk|BLsk|edesk|spesk|p2esk)[1-9A-HJ-NP-Za-km-z]{40,120}$/.test(t)) return 'a Tezos secret key';
  if (/^6P[1-9A-HJ-NP-Za-km-z]{56}$/.test(t)) return 'an encrypted private key (BIP-38)';
  if (/^EK[EF][1-9A-HJ-NP-Za-km-z]{48,60}$/.test(t) && base58CheckDecode(t)) return 'a Mina private key';
  const raw = /^[1-9A-HJ-NP-Za-km-z]{80,100}$/.test(t) ? base58Decode(t) : null;
  if (raw && raw.length === 64) return 'a Solana private key';
  // WIF (Bitcoin, Litecoin, Dogecoin, Dash, Zcash and others): Base58Check with a 33 or 34 byte payload.
  // No public address has that shape, so the version byte does not matter.
  if (/^[1-9A-HJ-NP-Za-km-z]{51,52}$/.test(t)) {
    const p = base58CheckDecode(t);
    if (p && (p.length === 33 || p.length === 34)) return 'a private key (WIF)';
  }
  return null;
}

/**
 * The longest run of seed words in a row. A real seed phrase is always one run of 12 to 24 words.
 * A list of addresses with short labels never is, so labels do not trip the guard (P-38).
 * @param {string[]} tokens
 */
function longestWordRun(tokens) {
  let best = 0;
  let run = 0;
  for (const t of tokens) {
    run = SEED_WORD.test(t.toLowerCase()) ? run + 1 : 0;
    if (run > best) best = run;
  }
  return best;
}

/**
 * Look for secrets in the whole input text.
 * @param {string} text
 * @returns {string | null} a description such as "a seed phrase", or null when the text looks safe
 */
export function findSecret(text) {
  const clean = text.replace(INVISIBLE, '');
  if (/PRIVATE KEY-+/i.test(clean)) return 'a PEM private key';
  if (/"(ciphertext|cipherparams|kdfparams)"/.test(clean)) return 'an encrypted wallet file';
  const raw = clean.split(SPLIT).filter(Boolean);
  // A key file as a list of 64 bytes, for example the Solana id.json file.
  const bytes = raw.filter(t => /^\d{1,3}$/.test(t) && Number(t) < 256);
  if (bytes.length >= 64 && bytes.length >= raw.length * 0.6) return 'a private key (JSON key file)';
  const tokens = raw.map(t => t.replace(GLUED_NUMBER, '')).filter(t => t && !NUMBERING.test(t));
  if (longestWordRun(tokens) >= 12) return 'a seed phrase';
  for (const t of tokens) {
    const hit = secretInToken(t);
    if (hit) return hit;
  }
  return null;
}
