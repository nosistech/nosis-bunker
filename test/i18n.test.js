// Language tests. Every text that the engine can show must have Spanish, and the page text
// must exist in both languages. See docs/decisions/ADR-028-two-languages.md.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { classify } from '../src/classify.js';
import { chainLabel } from '../src/explorer.js';
import { CHAINS } from '../src/chains.js';
import { moveAdvice, waitAdvice, keepAdvice } from '../src/advice.js';
import { GROUND_RULES, WATCH_LIST, buildPlan } from '../src/plan.js';
import { MODEL } from '../src/model.js';
import { toSpanish } from '../src/i18n/translate.js';
import { ES_LABELS } from '../src/i18n/es-labels.js';
import { UI_TEXT } from '../src/ui/text.js';
import { buildReport } from '../src/agent/report.js';
import { COSMOS_PREFIXES } from '../src/networks/cosmos.js';
import { SS58_NETWORKS } from '../src/networks/substrate.js';
import { bech32Encode, convertBits } from '../src/core/bech32.js';
import { base58Encode } from '../src/core/base58.js';
import { blake2b } from '../src/core/blake2b.js';
import { utf8 } from '../src/core/bytes.js';

const fixtures = JSON.parse(readFileSync(new URL('./fixtures/addresses.json', import.meta.url), 'utf8')).cases;
// English words that must not stay in Spanish output. Proper names are allowed.
const ENGLISH = /\b(the|and|account|address|key|hidden|until|this|wallet|unknown|test|network|send|move|legacy|public|contract|identifier|prefix|or|other|future)\b/i;
// Proper names that contain English words. They stay as they are in Spanish.
const PROPER = /\b(Secret|Canton) Network\b|\bMove o\b|\bInternet Computer\b|\bXRP Ledger\b/g;

/** @param {string} en @param {string} where */
function assertSpanish(en, where) {
  // Proper names that contain English words stay as they are.
  const es = toSpanish(en).replace(PROPER, '');
  assert.ok(!ENGLISH.test(es), where + ': not translated: "' + es + '"');
}

test('every engine sentence in the source has Spanish', () => {
  const files = [...readdirSync('src/networks').map(f => 'src/networks/' + f), 'src/model.js', 'src/advice.js', 'src/plan.js', 'src/chains.js', 'src/parse.js', 'src/classify.js'];
  let count = 0;
  for (const f of files) {
    const code = readFileSync(f, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
    for (const m of code.matchAll(/'((?:[^'\\\n]|\\.)*)'/g)) {
      for (const s of m[1].trim().split(/(?<=\.)\s+(?=[A-Z"])/)) {
        if (!/^[A-Z][^]*[a-z][^]*\.$/.test(s) || !/ [a-z]+ /.test(s)) continue;
        count++;
        assertSpanish(s, f);
      }
    }
  }
  assert.ok(count > 150, 'found ' + count + ' sentences');
});

test('every result for the real addresses and their typos is fully Spanish', () => {
  for (const c of fixtures) {
    const typo = c.address.slice(0, -1) + (c.address.at(-1) === 'q' ? 'p' : 'q');
    for (const a of [c.address, typo]) {
      const v = classify(a);
      for (const [k, t] of [['why', v.why], ['type', v.type], ['label', chainLabel(v)], ['askText', v.askText], ['moveText', v.moveText], ['pill', v.pill]]) {
        if (t) assertSpanish(t, c.source + ' ' + k);
      }
    }
  }
});

test('all plan advice and plan titles are Spanish', () => {
  for (const chain of [...Object.keys(CHAINS), null]) {
    for (const type of ['Taproot (bc1p)', 'Native SegWit (bc1q)']) {
      const e = { chain, type };
      assertSpanish(moveAdvice(e), 'move ' + chain);
      assertSpanish(waitAdvice(e), 'wait ' + chain);
      assertSpanish(keepAdvice(e), 'keep ' + chain);
    }
  }
  for (const s of [...GROUND_RULES, ...WATCH_LIST]) assertSpanish(s, 'plan list');
  const all = Object.values(MODEL).map((model, i) => ({ id: 'e' + i, address: 'x' + i, label: '', sent: 'yes', value: null, chain: 'btc', type: 'Legacy (1...)', model, why: '', detector: '' }));
  for (const g of buildPlan(all)) assertSpanish(g.title, 'plan title');
});

test('the page text exists in both languages', () => {
  const en = Object.keys(UI_TEXT.en).sort();
  const es = Object.keys(UI_TEXT.es).sort();
  assert.deepEqual(es, en);
  for (const k of en) assert.equal(typeof UI_TEXT.es[k], typeof UI_TEXT.en[k], k);
  const html = readFileSync('src/ui/template.html', 'utf8');
  assert.equal((html.match(/data-lang="en"/g) || []).length, (html.match(/data-lang="es"/g) || []).length, 'paired blocks');
  for (const m of html.matchAll(/data-i18n="([^"]+)"/g)) assert.ok(m[1] in UI_TEXT.en, 'missing key ' + m[1]);
});

/** Check every text that a verdict shows. @param {string} address @param {string} where */
function assertVerdictSpanish(address, where) {
  const v = classify(address);
  for (const [k, t] of [['type', v.type], ['label', chainLabel(v)], ['why', v.why], ['askText', v.askText], ['moveText', v.moveText], ['pill', v.pill]]) {
    if (t) assertSpanish(t, where + ' ' + k + ' (' + v.type + ')');
  }
}

test('generated addresses for every Cosmos prefix and every SS58 prefix are fully Spanish', () => {
  const bytes20 = Array.from({ length: 20 }, (_, i) => (i * 13 + 5) & 255);
  for (const hrp of Object.keys(COSMOS_PREFIXES)) {
    assertVerdictSpanish(bech32Encode(hrp, convertBits(bytes20, 8, 5, true), 'bech32'), 'cosmos ' + hrp);
  }
  const pub = Array.from({ length: 32 }, (_, i) => (i * 7 + 1) & 255);
  const ss58 = prefix => {
    const head = prefix < 64 ? [prefix] : [((prefix & 0xfc) >> 2) | 0x40, (prefix >> 8) | ((prefix & 3) << 6)];
    const body = [...head, ...pub];
    const pre = utf8('SS58PRE');
    const buf = new Uint8Array(pre.length + body.length);
    buf.set(pre); buf.set(body, pre.length);
    const h = blake2b(buf, 64);
    return base58Encode([...body, h[0], h[1]]);
  };
  for (const prefix of [...Object.keys(SS58_NETWORKS).map(Number), 7, 30, 1284]) assertVerdictSpanish(ss58(prefix), 'ss58 ' + prefix);
});

test('every label-like string in the detectors has Spanish, alone and as an account type', () => {
  const files = [...readdirSync('src/networks').map(f => 'src/networks/' + f), 'src/chains.js'];
  let count = 0;
  for (const f of files) {
    const code = readFileSync(f, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
    for (const m of code.matchAll(/'([A-Z][^'\n]{2,60})'/g)) {
      const s = m[1];
      // Skip sentences, URLs, constants, and string pieces that the code joins with a variable.
      if (/\.$|https?:|\{a\}|^[A-Z0-9_]+$|[(:]\s*$|\(prefix\s*$|^SegWit v$/.test(s)) continue;
      count++;
      assertSpanish(s, f + ' label');
    }
  }
  assert.ok(count > 80, 'found ' + count + ' labels');
  // Network names that the code turns into "<name> account" (the network picker, Cosmos and SS58).
  const names = [...Object.values(CHAINS).map(c => c.name), ...Object.values(COSMOS_PREFIXES).map(v => v[0]), ...Object.values(SS58_NETWORKS).map(v => v[0].replace(/ \(.*\)$/, ''))];
  for (const n of names) assertSpanish(n + ' account', n + ' as account type');
});

test('every checksum phrase and every guard phrase is a label, so it never stays English', () => {
  const sources = ['src/guard.js', ...readdirSync('src/networks').map(f => 'src/networks/' + f), 'src/model.js'];
  let count = 0;
  for (const f of sources) {
    const code = readFileSync(f, 'utf8');
    for (const m of code.matchAll(/(?:checksumFailed\(|return )'(an? [^']+)'/g)) {
      count++;
      assert.ok(m[1] in ES_LABELS, f + ': no Spanish for "' + m[1] + '"');
    }
  }
  assert.ok(count > 25, 'found ' + count + ' phrases');
  assert.equal(toSpanish('This looks like a Kaspa address, but the checksum is wrong. Look for a typo.'), 'Esto parece una dirección de Kaspa, pero la suma de verificación es incorrecta. Busca un error de tipeo.');
});

test('report errors are Spanish when asked', () => {
  const r = buildReport('abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about', { lang: 'es' });
  assert.equal(r.ok, false);
  if (!r.ok) assertSpanish(r.message, 'secret message');
  const big = buildReport('x'.repeat(100001), { lang: 'es' });
  if (!big.ok) assert.match(big.message, /caracteres/);
});

