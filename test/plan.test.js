// Plan tests: the status rules and the order of the plan.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseInput } from '../src/parse.js';
import { buildPlan, planText } from '../src/plan.js';
import { statusOf } from '../src/model.js';
import { explorerUrl } from '../src/explorer.js';
import { waitAdvice } from '../src/advice.js';

const input = [
  'bc1p5cyxnuxmeuwuvkwfem96lqzszd02n6xdcjrs20cac6yqjjwudpxqkedrcr Ordinals',
  'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4 Savings',
  '0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed Daily',
  'Alice::1220' + 'ab'.repeat(32) + ' Canton',
].join('\n');

test('status follows the model and the user answer', () => {
  const [taproot, savings] = parseInput(input).entries;
  assert.equal(statusOf(taproot), 'exposed');
  assert.equal(statusOf(savings), 'check');
  assert.equal(statusOf({ ...savings, sent: 'no' }), 'hidden');
  assert.equal(statusOf({ ...savings, sent: 'yes' }), 'exposed');
});

test('plan groups come in a fixed order and start with the ground rules', () => {
  const entries = parseInput(input).entries.map(e => (e.label === 'Daily' ? { ...e, sent: 'yes', value: 500 } : e));
  const keys = buildPlan(entries).map(g => g.key);
  assert.deepEqual(keys, ['rules', 'move', 'wait', 'check', 'watch']);
  const text = planText(buildPlan(entries));
  assert.match(text, /^BUNKER PLAN/);
  assert.match(text, /Ask your validator/);
});

test('explorer links are https or nothing', () => {
  for (const e of parseInput(input).entries) {
    const url = explorerUrl(e);
    assert.ok(url === null || url.startsWith('https://'), String(url));
  }
  assert.equal(explorerUrl({ chain: 'btc', model: 'visible', address: 'x', explorer: 'javascript:alert(1)//{a}' }), null);
});

test('Litecoin advice names Litecoin addresses, not Bitcoin ones (P-43)', () => {
  for (const type of ['Taproot (ltc1p)', 'MWEB address']) {
    const text = waitAdvice({ chain: 'ltc', type });
    assert.match(text, /ltc1q/);
    assert.doesNotMatch(text, /bc1q|BIP-360/);
  }
  assert.match(waitAdvice({ chain: 'btc', type: 'Taproot (bc1p)' }), /BIP-360/);
});

test('the plan asks the three provider questions of ADR-012 (P-45)', () => {
  const text = planText(buildPlan(parseInput(input).entries));
  assert.match(text, /Who can read the keys\? Can the keys change\? Is there a dated plan to move to post-quantum keys\?/);
});
