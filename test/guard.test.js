// Secret guard tests. The guard must block secrets and must not block real addresses.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { findSecret } from '../src/guard.js';
import { parseInput } from '../src/parse.js';
import { base58Encode } from '../src/core/base58.js';

const hex64 = 'ab'.repeat(32);

test('blocks seed phrases and private keys', () => {
  const secrets = {
    'a seed phrase': 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about',
    'a private key (WIF)': '5HueCGU8rMjxEXxiPuD5BDku4MkFqeZyd4dZ1jvhTVqvbTLvyTJ',
    'an extended private key': 'xprv9s21ZrQH143K3QTDL4LXw2F7HEK3wJUD2nW2nRk4stbPy6cq3jPPqjiChkVvvNKmPGJxWUtg6LnF5kejMRNNU3TGtRBeJgk33yuGBxrMPHi',
    'a raw private key': 'ab'.repeat(64),
    'a Nostr private key': 'nsec1' + 'q'.repeat(58),
    'a Tezos secret key': 'edsk' + '3'.repeat(50),
    'a Cardano private key': 'addr_xsk1abc',
    'a PEM private key': '-----BEGIN EC PRIVATE KEY-----\nabc',
    'an encrypted wallet file': '{"crypto":{"ciphertext":"aa"}}',
    'a Stellar secret key': 'S' + 'A'.repeat(55),
    'a Stacks private key': 'ab'.repeat(32) + '01',
    'a DER-encoded private key': '30770201010420' + 'ab'.repeat(32) + 'a00a06082a8648ce3d030107a14403420004' + 'cd'.repeat(32),
    'a private key': 'suiprivkey1qzabc',
    'a Solana private key': base58Encode(Array.from({ length: 64 }, (_, i) => (i * 11 + 7) & 255)),
    'an XRP secret key': 'snoPBrXtMeMyMHUVTgbuqAfg1SUTb',
    'an encrypted private key (BIP-38)': '6PRVWUbkzzPbcVqxoLpnMKLAn8fVcSW6ZLkcC4bXsBPHRMWe1ReWAh9wpn',
    'a Mina private key': 'EKECnxpjVamRRwnCD9WGcBds1FrU6NfTQsGv5F16NDudvsYhyhh2',
    'a private key (JSON key file)': '[' + Array.from({ length: 64 }, (_, i) => (i * 37) & 255).join(',') + ']',
  };
  for (const [what, text] of Object.entries(secrets)) assert.equal(findSecret(text), what, what);
  assert.match(findSecret(hex64), /raw private key/);
  assert.equal(findSecret('ab'.repeat(64)), 'a raw private key', '128 hex characters');
});

test('blocks seed phrases in other forms and languages, and WIF keys of other coins', () => {
  const seed = 'abandon ability able about above absent absorb abstract absurd abuse access accident';
  const forms = {
    numbered: seed.split(' ').map((w, i) => (i + 1) + '. ' + w).join(' '),
    'one word on each line': seed.split(' ').join('\n'),
    'upper case': seed.toUpperCase(),
    'with commas': seed.split(' ').join(', '),
    Spanish: 'ábaco abdomen abeja abierto abogado abono aborto abrazo abrir abuelo abuso acabar',
    French: 'abaisser abandon abdiquer abeille abolir aborder aboutir aboyer abrasif abreuver abriter abroger',
    Chinese: '的 一 是 在 不 了 有 和 人 这 中 大',
    Japanese: 'あいこくしん あいさつ あいだ あおぞら あかちゃん あきる あけがた あける あこがれる あさい あさひ あしあと',
    Korean: '가격 가끔 가난 가능 가득 가르침 가뭄 가방 가상 가스 가족 가지',
  };
  for (const [name, text] of Object.entries(forms)) assert.equal(findSecret(text), 'a seed phrase', name);
  // Forms that tried to slip past the guard in review: numbering glued to the word, invisible
  // characters between the words, a key inside JSON quotes, and a NEAR credential file.
  assert.equal(findSecret(seed.split(' ').map((w, i) => (i + 1) + '.' + w).join(' ')), 'a seed phrase', 'glued numbering');
  assert.equal(findSecret(seed.split(' ').join('\u200b \u200b')), 'a seed phrase', 'zero-width characters');
  assert.equal(findSecret('{"key":"' + hex64 + '"}'), 'a raw private key, or an address without its prefix', 'JSON quotes');
  assert.equal(findSecret('{"private_key":"ed25519:' + base58Encode(Array.from({ length: 64 }, (_, i) => (i * 5 + 3) & 255)) + '"}'), 'a private key', 'NEAR credential file');
  assert.equal(findSecret('MC4CAQAwBQYDK2VwBCIEIJ' + 'a'.repeat(40)), 'a PEM private key', 'PKCS#8 body without the header line');
  // WIF keys made with base58CheckEncode([version, ...32 bytes, 1]) for Dash (0xcc) and Komodo (0xbc).
  for (const wif of ['XBPYJbTMKtKADnEbGqPpqxTNYVV5BA26Y9Ek3ED8xgVm4LDPGLpf', 'Up7TA1gxXRexdW2JRd5Y7AwaZYGdpTgTw5Gf5xfd72SNZ33wrSVH']) {
    assert.equal(findSecret(wif), 'a private key (WIF)', wif.slice(0, 6));
  }
});

test('does not block real addresses or labels', () => {
  const safe = [
    '0x' + hex64, // Sui, Aptos, IOTA or Starknet address
    'a6b9670e7550389f927e41cb046c7f7f01a203f89cb15eb2fba6584661bd01b0', // ICP account with a valid CRC-32
    '03e7156ae33b0a208d0744199163177e909e80176e55d97a2f221ede0f934dd9ad', // Lightning node ID (BOLT 11 test vector)
    'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4 my savings wallet for the house',
    'GCKFBEIYV2U22IO2BJ4KVJOIP7XPWQGQFKKWXR6DOSJBV7STMAQSMTGG',
    'near:' + hex64, // NEAR implicit account with the prefix that Bunker accepts
    'ed25519:' + base58Encode(Array.from({ length: 32 }, (_, i) => (i * 5 + 3) & 255)), // a NEAR public key (32 bytes)
    'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA', // a Solana program (32 bytes, not a key)
  ];
  for (const text of safe) assert.equal(findSecret(text), null, text.slice(0, 20));
  // A list of addresses with short word labels is not a seed phrase, even with 12 or more words in total (P-38).
  const labeled = Array.from({ length: 8 }, (_, i) => 'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4 savings for the house ' + i).join('\n');
  assert.equal(findSecret(labeled), null, 'labeled list');
});

test('parseInput clears everything when a secret is present', () => {
  const r = parseInput('bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4\nabandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about');
  assert.equal(r.entries.length, 0);
  assert.ok(r.secret);
});

test('parseInput limits and duplicates', () => {
  const many = Array.from({ length: 600 }, (_, i) => 'line' + i).join('\n');
  const r = parseInput(many);
  assert.equal(r.entries.length, 500);
  assert.equal(r.truncated, true);
  const d = parseInput('1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa\n1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa Genesis');
  assert.equal(d.entries.length, 1);
});
