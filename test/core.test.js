// Core tests: every hash and encoding against published test vectors or Node's own crypto.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { sha256 } from '../src/core/sha256.js';
import { keccak256 } from '../src/core/keccak256.js';
import { blake2b } from '../src/core/blake2b.js';
import { sha512, sha512t256 } from '../src/core/sha512.js';
import { base32Decode } from '../src/core/base32.js';
import { crc32 } from '../src/core/crc32.js';
import { base58Decode, base58Encode, base58CheckDecode } from '../src/core/base58.js';
import { bech32Decode } from '../src/core/bech32.js';
import { cashaddrDecode } from '../src/core/cashaddr.js';
import { moneroBase58Decode } from '../src/core/monero-base58.js';
import { c32CheckDecode } from '../src/core/c32.js';
import { utf8 } from '../src/core/bytes.js';
import { eip55Valid } from '../src/networks/evm.js';

const hex = b => Buffer.from(b).toString('hex');
const sample = n => Uint8Array.from({ length: n }, (_, i) => (i * 7 + 3) & 255);

test('SHA-256 matches Node crypto for many lengths', () => {
  assert.equal(hex(sha256(utf8('abc'))), 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  for (const n of [0, 1, 55, 56, 63, 64, 65, 119, 1000]) {
    const m = sample(n);
    assert.equal(hex(sha256(m)), createHash('sha256').update(m).digest('hex'), 'length ' + n);
  }
});

test('Keccak-256 known values', () => {
  assert.equal(hex(keccak256(new Uint8Array())), 'c5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470');
  assert.equal(hex(keccak256(utf8('abc'))), '4e03657aea45a94fc7d47ba826c8d667c0d1e6e33a64a036ec44f58fa12d6c45');
});

test('BLAKE2b-512 matches Node crypto, BLAKE2b-256 known value', () => {
  for (const n of [0, 1, 127, 128, 129, 300]) {
    const m = sample(n);
    assert.equal(hex(blake2b(m)), createHash('blake2b512').update(m).digest('hex'), 'length ' + n);
  }
  assert.equal(hex(blake2b(new Uint8Array(), 32)), '0e5751c026e543b2e8ab2eb06099daa1d1e5df47778f7787faab45cdf12fe3a8');
});

test('SHA-512 and SHA-512/256 match Node crypto', () => {
  for (const n of [0, 1, 111, 112, 127, 128, 129, 300]) {
    const m = sample(n);
    assert.equal(hex(sha512(m)), createHash('sha512').update(m).digest('hex'), 'sha512 length ' + n);
    assert.equal(hex(sha512t256(m)), createHash('sha512-256').update(m).digest('hex'), 'sha512/256 length ' + n);
  }
});

test('Base32 accepts only the canonical form', () => {
  assert.ok(base32Decode('aa'));
  assert.equal(base32Decode('ab'), null, 'non-zero unused bits');
});

test('CRC-32 check value', () => {
  assert.equal(crc32(utf8('123456789')).toString(16), 'cbf43926');
});

test('Base58 round trip and Base58Check', () => {
  const m = Uint8Array.from([0, 0, 1, 2, 3, 250, 251]);
  assert.deepEqual(base58Decode(base58Encode(m)), m);
  assert.ok(base58CheckDecode('1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa'));
  assert.equal(base58CheckDecode('1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNb'), null);
  assert.equal(base58Decode('0OIl'), null);
});

test('Bech32 and Bech32m (BIP-173, BIP-350)', () => {
  assert.equal(bech32Decode('bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4').spec, 'bech32');
  assert.equal(bech32Decode('bc1p5cyxnuxmeuwuvkwfem96lqzszd02n6xdcjrs20cac6yqjjwudpxqkedrcr').spec, 'bech32m');
  assert.equal(bech32Decode('bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t5'), null);
  assert.equal(bech32Decode('BC1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4'), null, 'mixed case is invalid');
});

test('CashAddr specification example', () => {
  const r = cashaddrDecode('bitcoincash:qpm2qsznhks23z7629mms6s4cwef74vcwvy22gdx6a');
  assert.equal(r.version, 0);
  assert.equal(r.payload.length, 20);
  assert.equal(cashaddrDecode('bitcoincash:qpm2qsznhks23z7629mms6s4cwef74vcwvy22gdx6c'), null);
});

test('Monero and Stacks decoders', () => {
  assert.ok(moneroBase58Decode('44AFFq5kSiGBoZ4NMDwYtN18obc8AemS33DBLWs3H7otXft3XjrpDtQGv7SqSsaBYBb98uNbr2VBBEt7f2wfn3RVGQBEP3A'));
  assert.equal(c32CheckDecode('SP000000000000000000002Q6VF78').version, 22);
});

test('EIP-55 checksum', () => {
  assert.ok(eip55Valid('0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed'));
  assert.ok(eip55Valid('0x5aaeb6053f3e94c9b9a09f33669435e7ef1beaed'), 'lowercase has no checksum');
  assert.equal(eip55Valid('0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAeD'), false);
});
