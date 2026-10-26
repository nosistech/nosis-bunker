// @ts-check
// Draw the results, the summary and the plan from UI_STATE, in the current language.
// All text goes in with textContent (see dom.js). The engine text is English; tr() translates it.
import { statusOf, STATUS, MODEL } from '../model.js';
import { explorerUrl, chainLabel } from '../explorer.js';
import { buildPlan, planText, shortAddress } from '../plan.js';
import { CHAINS } from '../chains.js';
import { translatorFor } from '../i18n/translate.js';
import { UI_TEXT, verdictParts } from './text.js';
import { UI_STATE } from './state.js';
import { uiEl, uiById, uiIcon, uiMoney } from './dom.js';

const UI_STATUS = {
  [STATUS.EXPOSED]: ['Lock visible', 'open'], [STATUS.HIDDEN]: ['Lock hidden', 'locked'],
  [STATUS.CHECK]: ['Check needed', 'question'], [STATUS.PROTECTED]: ['Hash-protected', 'locked'],
  [STATUS.WARNING]: ['Shows every key', 'question'], [STATUS.UNKNOWN]: ['Not rated', 'dash'],
};

/** Status groups in the order of the meter. */
const UI_GROUPS = [
  ['ex', [STATUS.EXPOSED], 'Lock visible'],
  ['ck', [STATUS.CHECK, STATUS.WARNING], 'Check needed'],
  ['hd', [STATUS.HIDDEN, STATUS.PROTECTED], 'Lock hidden'],
  ['un', [STATUS.UNKNOWN], 'Not rated'],
];

export function uiText() {
  return UI_TEXT[UI_STATE.lang];
}

/**
 * A segmented control. Each button carries data-act and data-v for the click handler.
 * @param {string} label
 * @param {string} act
 * @param {[string, string][]} options value, text
 * @param {string} current
 */
function uiSegment(label, act, options, current) {
  const seg = uiEl('span', { class: 'seg', role: 'group', 'aria-label': label });
  for (const [value, text] of options) {
    seg.append(uiEl('button', { type: 'button', 'data-act': act, 'data-v': value, 'aria-pressed': String(current === value), text }));
  }
  return uiEl('div', { class: 'ask' }, [uiEl('span', { class: 'ask-q', 'aria-hidden': 'true', text: label }), seg]);
}

/** @param {import('../parse.js').Entry} e */
function uiCard(e) {
  const t = uiText();
  const tr = translatorFor(UI_STATE.lang);
  const st = statusOf(e);
  const statusText = tr(e.model === MODEL.ASK_PROVIDER ? (e.pill || 'Ask your provider') : UI_STATUS[st][0]);
  const card = uiEl('article', { class: 'row-item ' + st, 'data-id': e.id, 'aria-label': (e.label || shortAddress(e.address)) + ': ' + statusText });
  card.append(
    uiEl('div', { class: 'row-top' }, [
      uiEl('span', { class: 'status ' + st }, [uiIcon(UI_STATUS[st][1]), statusText]),
      uiEl('span', { class: 'net' }, [uiEl('b', { text: tr(chainLabel(e)) }), uiEl('span', { text: tr(e.type) })]),
    ]),
    uiEl('div', { class: e.label ? 'who' : 'who none', text: e.label || t.noLabel }),
    uiEl('div', { class: 'addr', text: e.address }),
    uiEl('p', { class: 'why', text: tr(e.why) }),
  );
  if (e.networks) card.append(uiEl('p', { class: 'why extra', text: tr('Same key on ' + e.networks + '. ' + (e.tokens || '')) }));
  if (e.options) card.append(uiSegment(t.netQ, 'net', e.options.map(o => [o, CHAINS[o].name]), e.chain || ''));
  if (e.model === MODEL.HIDDEN_UNTIL_USED) {
    card.append(uiSegment(t.sentQ, 'sent', [['unsure', t.notSure], ['no', t.no], ['yes', t.yes]], e.sent));
  }
  const foot = uiEl('div', { class: 'row-foot' });
  if (e.model !== MODEL.UNKNOWN && e.model !== MODEL.XPUB) {
    const input = uiEl('input', { id: 'v_' + e.id, 'data-act': 'value', inputmode: 'decimal', maxlength: '16', autocomplete: 'off', placeholder: t.valuePh, 'aria-label': t.valueAria });
    if (e.value !== null) /** @type {HTMLInputElement} */ (input).value = String(e.value);
    foot.append(uiEl('label', { class: 'val' }, [uiEl('span', { 'aria-hidden': 'true', text: '$' }), input]));
  }
  const links = uiEl('span', { class: 'links' });
  const href = explorerUrl(e);
  if (href) links.append(uiEl('a', { href, target: '_blank', rel: 'noopener noreferrer', text: t.explorer }));
  links.append(uiEl('button', { type: 'button', class: 'linkbtn', 'data-act': 'remove', 'aria-label': t.remove + ': ' + (e.label || shortAddress(e.address)), text: t.remove }));
  foot.append(links);
  card.append(foot);
  return card;
}

/** @param {boolean} [grow] true right after a scan, to play the meter fill */
export function uiRenderSummary(grow = false) {
  const tr = translatorFor(UI_STATE.lang);
  const verdictEl = uiById('verdict');
  const meter = uiById('meter');
  const legend = uiById('legend');
  verdictEl.replaceChildren();
  meter.replaceChildren();
  legend.replaceChildren();
  const all = UI_STATE.entries;
  verdictEl.hidden = meter.hidden = legend.hidden = !all.length;
  if (!all.length) return;
  /** @type {Record<string, import('../parse.js').Entry[]>} */
  const by = {};
  for (const [cls, states] of UI_GROUPS) by[cls] = all.filter(e => states.includes(statusOf(e)));
  const sum = list => list.reduce((s, e) => s + (e.value || 0), 0);
  const atRisk = sum(by.ex);
  for (const p of verdictParts(UI_STATE.lang, { n: all.length, ex: by.ex.length, ck: by.ck.length, atRisk: atRisk ? uiMoney(atRisk) : '' })) {
    verdictEl.append(typeof p === 'string' ? p : uiEl('span', { class: p[0], text: p[1] }));
  }
  for (const [cls, , word] of UI_GROUPS) {
    const list = by[cls];
    for (let i = 0; i < list.length; i++) meter.append(uiEl('span', { class: cls }));
    if (!list.length) continue;
    const text = uiEl('span', {}, [tr(word) + ': ', uiEl('b', { text: String(list.length) })]);
    if (sum(list)) text.append(' (' + uiMoney(sum(list)) + ')');
    legend.append(uiEl('li', { class: cls }, [uiEl('i'), text]));
  }
  meter.classList.toggle('grow', grow);
}

export function uiRenderPlan() {
  const tr = translatorFor(UI_STATE.lang);
  const groups = buildPlan(UI_STATE.entries);
  const plan = uiById('plan');
  plan.replaceChildren();
  for (const g of groups) {
    const ul = uiEl('ul');
    for (const it of g.items) {
      if (!it.entry) { ul.append(uiEl('li', { text: tr(it.text) })); continue; }
      const e = it.entry;
      const tag = [tr(chainLabel(e)), e.value ? uiMoney(e.value) : ''].filter(Boolean).join(', ');
      ul.append(uiEl('li', {}, [uiEl('b', { text: e.label || shortAddress(e.address) }), ' (' + tag + '). ' + tr(it.text)]));
    }
    plan.append(uiEl('li', {}, [uiEl('div', {}, [uiEl('h3', { text: tr(g.title) }), ul])]));
  }
  /** @type {HTMLTextAreaElement} */ (uiById('plantext')).value = planText(groups, { tr, title: uiText().planTitle });
}

/** @param {boolean} [grow] */
export function uiRender(grow = false) {
  uiById('exbanner').hidden = !UI_STATE.isExample || !UI_STATE.entries.length;
  const cards = uiById('cards');
  cards.replaceChildren();
  if (!UI_STATE.entries.length) cards.append(uiEl('div', { class: 'empty', text: uiText().empty }));
  for (const e of UI_STATE.entries) cards.append(uiCard(e));
  uiRenderSummary(grow);
  uiRenderPlan();
}

/** Show how many lines the box holds, so the user knows what Scan will read. */
export function uiUpdateCount() {
  const t = uiText();
  const lines = /** @type {HTMLTextAreaElement} */ (uiById('addrs')).value.split(/\r?\n/).filter(l => l.trim()).length;
  uiById('count').textContent = lines ? lines + ' ' + (lines === 1 ? t.line : t.lines) : '';
}

/** @param {string} what English noun phrase from the guard, for example "a seed phrase" */
export function uiShowSecretAlert(what) {
  const t = uiText();
  const alert = uiById('alert');
  alert.replaceChildren(uiEl('strong', { text: t.secretIs.replace('{what}', translatorFor(UI_STATE.lang)(what)) }));
  if (/prefix/.test(what)) alert.append(uiEl('p', { text: t.prefixHint }));
  alert.append(uiEl('p', { text: t.neverSent }));
  alert.hidden = false;
}
