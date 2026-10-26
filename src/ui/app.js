// @ts-check
// The page controller. It wires the buttons to the engine. Drawing is in render.js.
// Security: nothing is stored and nothing is sent. The page has no network code.
// test/security.test.js fails the build if this changes.
import { parseInput } from '../parse.js';
import { CHAINS } from '../chains.js';
import { UI_STATE, UI_EXAMPLE } from './state.js';
import { uiById } from './dom.js';
import { uiText, uiRender, uiRenderSummary, uiRenderPlan, uiUpdateCount, uiShowSecretAlert } from './render.js';
import { uiStartLang, uiApplyLang, uiToggleTheme, uiWatchSystemTheme } from './prefs.js';

/**
 * @param {string} text
 * @param {boolean} example
 */
function uiScan(text, example) {
  const res = parseInput(text);
  const textarea = /** @type {HTMLTextAreaElement} */ (uiById('addrs'));
  if (res.secret) {
    textarea.value = '';
    uiShowSecretAlert(res.secret);
    uiUpdateCount();
    return;
  }
  uiById('alert').hidden = true;
  const previous = new Map(UI_STATE.entries.map(e => [e.address, e]));
  UI_STATE.entries = res.entries.map(e => {
    const p = previous.get(e.address);
    if (!p) return e;
    return { ...e, sent: p.sent, value: p.value, chain: e.options ? p.chain : e.chain, type: e.options ? p.type : e.type };
  });
  UI_STATE.isExample = example;
  if (example) {
    const answers = new Map(UI_EXAMPLE.map(([a, sent, value]) => [a, [sent, value]]));
    UI_STATE.entries = UI_STATE.entries.map(e => {
      const a = answers.get(e.address);
      return a ? { ...e, sent: a[0] || e.sent, value: /** @type {number} */ (a[1]) } : e;
    });
  }
  uiRender(true);
  uiUpdateCount();
}

function uiLoadExample() {
  const labels = uiText().exampleLabels;
  const textarea = /** @type {HTMLTextAreaElement} */ (uiById('addrs'));
  textarea.value = UI_EXAMPLE.map(([a], i) => a + ' ' + labels[i]).join('\n');
  UI_STATE.entries = [];
  uiScan(textarea.value, true);
}

/** After a scan, bring the results into view if they are below the screen. */
function uiRevealResults() {
  const results = uiById('results');
  if (results.getBoundingClientRect().top > window.innerHeight * 0.6) {
    results.scrollIntoView({ block: 'start' });
    results.focus({ preventScroll: true });
  }
}

/** @param {string} id */
function uiFind(id) {
  return UI_STATE.entries.findIndex(x => x.id === id);
}

function uiWireRows() {
  const textarea = /** @type {HTMLTextAreaElement} */ (uiById('addrs'));
  const cards = uiById('cards');
  cards.addEventListener('click', ev => {
    const btn = /** @type {HTMLElement} */ (ev.target).closest('[data-act]');
    if (!btn || btn.tagName === 'INPUT') return;
    const card = /** @type {HTMLElement | null} */ (btn.closest('.row-item'));
    const i = card ? uiFind(card.dataset.id || '') : -1;
    if (i < 0) return;
    const e = UI_STATE.entries[i];
    const act = btn.getAttribute('data-act');
    const v = btn.getAttribute('data-v') || '';
    if (act === 'sent' && ['unsure', 'no', 'yes'].includes(v)) UI_STATE.entries[i] = { ...e, sent: v };
    if (act === 'net' && e.options && e.options.includes(v)) UI_STATE.entries[i] = { ...e, chain: v, type: CHAINS[v].name + ' account' };
    if (act === 'remove') {
      UI_STATE.entries = UI_STATE.entries.filter((_, j) => j !== i);
      textarea.value = UI_STATE.entries.map(x => x.address + (x.label ? ' ' + x.label : '')).join('\n');
      uiUpdateCount();
    }
    uiRender();
    // The rows are rebuilt, so put keyboard focus back where it was (P-25).
    const again = act === 'remove' ? null
      : cards.querySelector('[data-id="' + CSS.escape(e.id) + '"] [data-act="' + CSS.escape(act || '') + '"][data-v="' + CSS.escape(v) + '"]');
    /** @type {HTMLElement} */ (again || uiById('results')).focus({ preventScroll: true });
  });
  cards.addEventListener('input', ev => {
    const input = /** @type {HTMLInputElement} */ (ev.target);
    if (input.getAttribute('data-act') !== 'value') return;
    const card = /** @type {HTMLElement | null} */ (input.closest('.row-item'));
    const i = card ? uiFind(card.dataset.id || '') : -1;
    if (i < 0) return;
    const n = parseFloat(input.value.replace(/[^0-9.]/g, ''));
    UI_STATE.entries[i] = { ...UI_STATE.entries[i], value: Number.isFinite(n) && n >= 0 && n < 1e15 ? n : null };
    uiRenderSummary();
    uiRenderPlan();
  });
}

function uiWirePlan() {
  uiById('print').addEventListener('click', () => window.print());
  uiById('copy').addEventListener('click', () => {
    const area = /** @type {HTMLTextAreaElement} */ (uiById('plantext'));
    const done = msg => { uiById('copied').textContent = msg; };
    const fallback = () => {
      area.classList.remove('sr');
      area.classList.add('fallback');
      area.removeAttribute('aria-hidden');
      area.removeAttribute('tabindex');
      area.select();
      done(uiText().copyFallback);
    };
    try {
      navigator.clipboard.writeText(area.value).then(() => done(uiText().copied), fallback);
    } catch {
      fallback();
    }
  });
}

function uiWireHeader() {
  for (const btn of document.querySelectorAll('[data-setlang]')) {
    btn.addEventListener('click', () => {
      const lang = btn.getAttribute('data-setlang') === 'es' ? 'es' : 'en';
      if (lang === UI_STATE.lang) return;
      uiApplyLang(lang);
      uiById('copied').textContent = '';
      if (UI_STATE.isExample) uiLoadExample();
      else uiRender();
      uiUpdateCount();
      if (!uiById('alert').hidden) uiById('alert').hidden = true;
    });
  }
  uiById('theme').addEventListener('click', uiToggleTheme);
  uiWatchSystemTheme();
  // Footer links open the section they point to.
  for (const link of document.querySelectorAll('[data-open]')) {
    link.addEventListener('click', () => {
      const target = document.getElementById(link.getAttribute('data-open') || '');
      if (target instanceof HTMLDetailsElement) target.open = true;
    });
  }
}

function uiStart() {
  const textarea = /** @type {HTMLTextAreaElement} */ (uiById('addrs'));
  const scanNow = () => { uiScan(textarea.value, false); if (UI_STATE.entries.length) uiRevealResults(); };
  const clearAll = () => {
    textarea.value = '';
    UI_STATE.entries = [];
    UI_STATE.isExample = false;
    uiById('alert').hidden = true;
    uiRender();
    uiUpdateCount();
    textarea.focus();
  };
  uiById('scan').addEventListener('click', scanNow);
  uiById('clear').addEventListener('click', clearAll);
  uiById('clear2').addEventListener('click', clearAll);
  uiById('example').addEventListener('click', uiLoadExample);
  textarea.addEventListener('input', uiUpdateCount);
  textarea.addEventListener('keydown', ev => {
    if (ev.key === 'Enter' && (ev.ctrlKey || ev.metaKey)) { ev.preventDefault(); scanNow(); }
  });
  // Check pasted or dropped text for secrets at once, so a seed phrase does not stay on screen.
  const checkSoon = () => setTimeout(() => {
    if (parseInput(textarea.value).secret) uiScan(textarea.value, false);
  }, 0);
  textarea.addEventListener('paste', checkSoon);
  textarea.addEventListener('drop', checkSoon);
  uiWireRows();
  uiWirePlan();
  uiWireHeader();
  uiApplyLang(uiStartLang());
  uiLoadExample();
}

if (typeof document !== 'undefined') uiStart();
