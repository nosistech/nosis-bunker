// Network tests. Part 1 uses real public addresses (fixtures/addresses.json).
// Part 2 builds sample addresses with the encoders, for formats without a public example.
// Part 3 changes one character of each real address and expects a different result (typo detection).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { classify } from '../src/classify.js';
import { base58Encode, base58CheckEncode } from '../src/core/base58.js';
import { bech32Encode, convertBits } from '../src/core/bech32.js';
import { blake2b } from '../src/core/blake2b.js';
import { base32Encode } from '../src/core/base32.js';
import { crc32 } from '../src/core/crc32.js';
import { utf8 } from '../src/core/bytes.js';
import { crc16Xmodem } from '../src/core/crc16.js';
import { detectBase58 } from '../src/networks/base58-family.js';

const fixtures = JSON.parse(readFileSync(new URL('./fixtures/addresses.json', import.meta.url), 'utf8')).cases;
const liquid = JSON.parse(readFileSync(new URL('./fixtures/liquid-reference.json', import.meta.url), 'utf8'));

// Fixed bytes so that every test run uses the same sample addresses.
const bytes = (n, seed = 7) => Array.from({ length: n }, (_, i) => (i * 31 + seed * 17) & 255);
const bech = (hrp, data, spec = 'bech32', version) => bech32Encode(hrp, (version === undefined ? [] : [version]).concat(convertBits(data, 8, 5, true)), spec);

test('real public addresses get the expected network and model', () => {
  for (const c of fixtures) {
    const r = classify(c.address);
    assert.equal(r.chain, c.chain, c.source + ': chain');
    assert.equal(r.model, c.model, c.source + ': model');
  }
});

test('Liquid confidential addresses from the Elements reference library', () => {
  assert.equal(classify(liquid.p2wpkh).model, 'hidden-until-used');
  assert.equal(classify(liquid.p2wsh).type, 'Liquid confidential script');
  assert.equal(classify(liquid.p2tr).model, 'visible');
});

test('one changed character is never accepted as the same valid address', () => {
  const swap = ch => (ch === 'q' ? 'p' : ch === 'p' ? 'q' : ch === 'a' ? 'b' : ch === 'A' ? 'B' : ch === '2' ? '3' : '2');
  for (const c of [...fixtures.filter(f => f.model !== 'unknown'), { address: liquid.p2wpkh, source: 'liquid' }]) {
    const a = c.address;
    if (/^(0x|xdc|ronin:)[0-9a-f]+$/.test(a) || /^0x[0-9a-fA-F]{16}$/.test(a)) continue; // lowercase hex has no checksum by design
    if (/^03[0-9a-f]{64}$/.test(a)) continue; // a node ID is a raw key, any hex is a possible key
    const i = a.length - 3;
    const changed = a.slice(0, i) + swap(a[i]) + a.slice(i + 1);
    const r = classify(changed);
    assert.ok(r.model === 'unknown' || r.type === 'Checksum failed', c.source + ': typo not detected (' + r.type + ')');
  }
});

test('sample addresses for formats without a public example', () => {
  const cases = [
    [bech('ark', bytes(66), 'bech32m'), 'ark', 'visible'],
    [bech('spark', [10, 33, 2, ...bytes(32)], 'bech32m'), 'spark', 'visible'],
    [bech('ltcmweb', bytes(66), 'bech32', 0), 'ltc', 'visible'],
    [bech('ex', bytes(20), 'bech32', 0), 'liquid', 'hidden-until-used'],
    [bech('dgb', bytes(20), 'bech32', 0), 'dgb', 'hidden-until-used'],
    [bech('ltc', bytes(32), 'bech32m', 1), 'ltc', 'visible'],
    [bech('bc', bytes(32), 'bech32m', 2), 'btc', 'hash-safe'],
    [bech('zs', bytes(43)), 'zec', 'move-pool'],
    [bech('u', bytes(80), 'bech32m'), 'zec', 'ask-provider'],
    [bech('tex', bytes(20), 'bech32m'), 'zec', 'hidden-until-used'],
    [bech('bbn', bytes(20)), 'cosmos', 'hidden-until-used'],
    [bech('pb', bytes(20)), 'cosmos', 'hidden-until-used'],
    [bech('oasis', bytes(21)), 'hashacct', 'hidden-until-used'],
    [bech('iota', bytes(33)), 'iota', 'hidden-until-used'],
    [base58CheckEncode([0x1c, 0xb8, ...bytes(20)]), 'zec', 'hidden-until-used'],
    [base58CheckEncode([0x1c, 0xbd, ...bytes(20)]), 'zec', 'hidden-until-used'],
    [base58CheckEncode([6, 161, 161, ...bytes(20)]), 'xtz', 'hidden-until-used'],
    [base58CheckEncode([0x35, ...bytes(20)]), 'neo', 'hidden-until-used'],
    [base58CheckEncode([0x4c, ...bytes(20)]), 'dash', 'hidden-until-used'],
    [base58CheckEncode([0x3c, ...bytes(20)]), 'rvn', 'hidden-until-used'],
    ['Alice::1220' + 'ab'.repeat(32), 'canton', 'ask-provider'],
    ['0.0.123-vfmkw', 'hbar', 'visible'],
    ['near:' + 'ab'.repeat(32), 'near', 'visible'],
    ['example.near', 'near', 'visible'],
    ['0x0' + 'a'.repeat(63), 'sui', 'hidden-until-used'],
    ['0x2' + 'a'.repeat(62), 'starknet', 'hidden-until-used'],
    ['f410f' + base32Encode([...bytes(20), ...blake2b(Uint8Array.from([4, 10, ...bytes(20)]), 4)]), 'evm', 'hidden-until-used'],
  ];
  for (const [address, chain, model] of cases) {
    const r = classify(address);
    assert.equal(r.chain, chain, address.slice(0, 24) + ' chain');
    assert.equal(r.model, model, address.slice(0, 24) + ' model');
  }
});

test('Stellar muxed account with a valid CRC-16', () => {
  const body = [12 << 3, ...bytes(40)];
  const crc = crc16Xmodem(body);
  const text = base32Encode([...body, crc & 255, crc >> 8]).toUpperCase();
  assert.equal(classify(text).type, 'Stellar muxed account');
});

test('Filecoin f3 and SS58 two-byte prefixes', () => {
  const payload = bytes(48);
  const f3 = 'f3' + base32Encode([...payload, ...blake2b(Uint8Array.from([3, ...payload]), 4)]);
  assert.equal(classify(f3).model, 'visible');
  const prefix = 1284;
  const pre = [((prefix & 0xfc) >> 2) | 0x40, (prefix >> 8) | ((prefix & 3) << 6)];
  const body = [...pre, ...bytes(32)];
  const h = blake2b(Uint8Array.from([...utf8('SS58PRE'), ...body]), 64);
  const r = classify(base58Encode(Uint8Array.from([...body, h[0], h[1]])));
  assert.equal(r.chain, 'substrate');
  assert.match(r.chainLabel, /prefix 1284/);
});

test('ICP user principal and the 64-hex rule', () => {
  const body = [...bytes(28), 2];
  const v = crc32(body);
  const raw = [v >>> 24, (v >>> 16) & 255, (v >>> 8) & 255, v & 255, ...body];
  const text = base32Encode(raw).match(/.{1,5}/g).join('-');
  assert.equal(classify(text).type, 'ICP principal (user)');
});

test('inputs that are not wallets are not rated', () => {
  for (const a of ['example.eth', 'name@example.com', 'tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx', 'hello', '', 'x'.repeat(5000)]) {
    assert.equal(classify(a).model, 'unknown', a.slice(0, 20));
  }
});

test('each detector answers for the expected inputs (pipeline order)', () => {
  assert.equal(classify('0x4a220e6096b25eadb88358cb44068a3248254675').detector, 'known-contracts');
  assert.equal(classify('SP000000000000000000002Q6VF78').detector, 'stacks');
  assert.equal(classify('15oF4uVJwmo4TdGW7VfQxNLavjCXviqxT9S1MgbjMNHr6Sp5').detector, 'substrate');
  assert.equal(classify(liquid.p2wpkh).detector, 'liquid');
});

test('wrong encodings and bad headers are reported as checksum failures, never as another network', () => {
  const typo = 'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t5'; // a Bech32 typo with a wrong checksum (P-37)
  assert.equal(classify(typo).type, 'Checksum failed');
  assert.match(classify(typo).why, /Bech32/);
  // P-37: the DigiByte sample has 43 characters that are all Base58. With one changed character, the
  // Solana rule alone accepts it (32 bytes). The Bech32 shape rule must stop the pipeline first.
  const dgb = bech('dgb', bytes(20), 'bech32', 0);
  const dgbTypo = dgb.slice(0, 5) + 'q' + dgb.slice(6);
  assert.notEqual(dgbTypo, dgb);
  assert.equal((detectBase58(dgbTypo) || {}).chain, 'sol');
  assert.equal(classify(dgbTypo).type, 'Checksum failed');
  assert.match(classify(dgbTypo).why, /Bech32/);
  const cases = [
    [bech('bc', bytes(20), 'bech32m', 0), /SegWit address \(the encoding/], // version 0 must use Bech32
    [bech('bc', bytes(32), 'bech32', 1), /SegWit address \(the encoding/], // version 1 must use Bech32m
    [bech('bc', bytes(25), 'bech32', 0), /SegWit address/], // version 0 programs are 20 or 32 bytes
    [bech('zs', bytes(43), 'bech32m'), /Zcash Sapling/], // Sapling uses Bech32
    [bech('u', bytes(50), 'bech32'), /Zcash unified/], // unified addresses use Bech32m
    [bech('addr', [0x81, ...bytes(56)], 'bech32'), /Cardano address \(the header/], // header 8 is not a payment address
    [bech('stake', [0x01, ...bytes(28)], 'bech32'), /Cardano stake address/], // header 0 is not a stake address
    ['ronin:' + 'aB'.repeat(20), /Ethereum-style/], // mixed case that does not match EIP-55
    ['xdc' + 'aB'.repeat(20), /Ethereum-style/],
    ['f410f' + 'a'.repeat(39), /Filecoin/], // a wrong BLAKE2b checksum
    [bech('sp', bytes(66), 'bech32', 0), /Silent Payment/], // Silent Payments use Bech32m
  ];
  for (const [a, why] of cases) {
    const r = classify(a);
    assert.equal(r.type, 'Checksum failed', a.slice(0, 16) + ': ' + r.type);
    assert.match(r.why, why, a.slice(0, 16));
  }
  const tonBody = [0x91, 0, ...bytes(32)]; // tag 0x91: bounceable, test network
  const tonCrc = crc16Xmodem(tonBody);
  const ton = Buffer.from([...tonBody, tonCrc >> 8, tonCrc & 255]).toString('base64url');
  assert.equal(classify(ton).type, 'TON test address');
  assert.equal(classify('11111111111111111111111111111111').model, 'unknown', 'the Solana System Program is not a wallet');
});

test('Starknet is offered only for values below 2^251 (P-44)', () => {
  const choices = a => classify(a).options || [];
  assert.ok(choices('0x05' + 'a'.repeat(62)).includes('starknet'));
  assert.ok(choices('0x07' + 'f'.repeat(62)).includes('starknet'));
  assert.ok(!choices('0x08' + '0'.repeat(62)).includes('starknet'));
  // The IOTA fixture starts with 6, so it is far above 2^251.
  assert.ok(!choices('0x6ff58b444b315dfce46fe44384a0bdcecce41cf818172571bab6ba7136c68a95').includes('starknet'));
  assert.equal(classify('0x7' + 'f'.repeat(62)).chain, 'starknet');
  assert.notEqual(classify('0x8' + '0'.repeat(62)).chain, 'starknet');
});
