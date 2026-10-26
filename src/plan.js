// @ts-check
// buildPlan(): entries in, an ordered list of plan groups out. planText(): the plan as plain text.
import { MODEL, STATUS, statusOf } from './model.js';
import { moveAdvice, waitAdvice, keepAdvice } from './advice.js';
import { chainLabel } from './explorer.js';

export const GROUND_RULES = Object.freeze([
  'Do not hurry. A bad migration can cost more than the risk that you try to avoid.',
  'Do not type a seed phrase or private key into a website or chat. Real tools do not ask for it.',
  'Do not follow links that tell you to "migrate now". Use only your own wallet app.',
  'Ledger and Trezor do not send a "quantum patch" by email. Update firmware only in Ledger Live or Trezor Suite.',
  'Send a small test amount before each large move.',
]);

export const WATCH_LIST = Object.freeze([
  'Bitcoin: activation of BIP-360 (quantum-safe outputs), and the BIP-361 discussion about a freeze of coins that do not move.',
  'Ethereum and EVM networks: the hash-based signature roadmap, and smart accounts that can change signature types.',
  'Solana: a post-quantum signature upgrade for the network.',
  'Networks that can change keys (Aptos, Starknet, Flow, XRP, Stellar, Algorand, NEAR, Hedera): support for post-quantum keys.',
]);

export const PLAN_DISCLAIMER = 'Educational tool. Not financial, legal or security advice. Examine each address on a block explorer before you move funds.';

const DEFAULT_ASK = 'Look for an outgoing transaction or a signed message on a block explorer. If you find one, select "Yes".';

/**
 * @typedef {{ text: string, entry?: import('./parse.js').Entry }} PlanItem
 * @typedef {{ key: string, title: string, items: PlanItem[] }} PlanGroup
 */

/**
 * @param {import('./parse.js').Entry[]} entries
 * @returns {PlanGroup[]}
 */
export function buildPlan(entries) {
  const byStatus = s => entries.filter(e => statusOf(e) === s).sort((a, b) => (b.value || 0) - (a.value || 0));
  const exposed = byStatus(STATUS.EXPOSED);
  /** @type {PlanGroup[]} */
  const groups = [{ key: 'rules', title: 'Ground rules', items: GROUND_RULES.map(text => ({ text })) }];

  const movable = exposed.filter(e => e.model === MODEL.HIDDEN_UNTIL_USED || e.model === MODEL.MOVE_POOL);
  if (movable.length) {
    const title = movable.some(e => e.model === MODEL.MOVE_POOL) ? 'Move to new addresses or a safer pool' : 'Move to new addresses';
    groups.push({ key: 'move', title, items: movable.map(e => ({ entry: e, text: moveAdvice(e) })) });
  }
  const waiting = exposed.filter(e => e.model === MODEL.VISIBLE);
  if (waiting.length) groups.push({ key: 'wait', title: 'Visible with no hidden option yet', items: waiting.map(e => ({ entry: e, text: waitAdvice(e) })) });

  const check = byStatus(STATUS.CHECK);
  if (check.length) groups.push({ key: 'check', title: 'Check or ask', items: check.map(e => ({ entry: e, text: e.askText || DEFAULT_ASK })) });

  const xpubs = byStatus(STATUS.WARNING);
  if (xpubs.length) {
    groups.push({ key: 'xpub', title: 'Stop sharing extended public keys', items: xpubs.map(e => ({ entry: e,
      text: 'Remove this xpub from portfolio trackers and apps. Anyone with it can see the public key of every address it makes.' })) });
  }
  const hidden = byStatus(STATUS.HIDDEN);
  if (hidden.length) groups.push({ key: 'keep', title: 'Keep these locks hidden', items: hidden.map(e => ({ entry: e, text: keepAdvice(e) })) });

  groups.push({ key: 'watch', title: 'Watch for the real fixes', items: WATCH_LIST.map(text => ({ text })) });
  return groups;
}

/** @param {string} a */
export function shortAddress(a) {
  return a.length > 18 ? a.slice(0, 8) + '...' + a.slice(-6) : a;
}

/**
 * The plan as plain text, for Copy plan, the CLI and agents.
 * @param {PlanGroup[]} groups
 * @param {{ tr?: (s: string) => string, title?: string }} [opt] tr translates engine text (default: none)
 * @returns {string}
 */
export function planText(groups, opt = {}) {
  const tr = opt.tr || (s => s);
  const lines = [opt.title || 'BUNKER PLAN', ''];
  groups.forEach((g, i) => {
    lines.push((i + 1) + '. ' + tr(g.title));
    for (const it of g.items) {
      if (it.entry) {
        const e = it.entry;
        const tag = [tr(chainLabel(e)), e.label, e.value ? '$' + Math.round(e.value).toLocaleString('en-US') : ''].filter(Boolean).join(' | ');
        lines.push('   - ' + shortAddress(e.address) + ' (' + tag + '): ' + tr(it.text));
      } else {
        lines.push('   - ' + tr(it.text));
      }
    }
    lines.push('');
  });
  lines.push(tr(PLAN_DISCLAIMER));
  lines.push('Bunker by NosisTech. https://bunker.nosistech.com');
  return lines.join('\n');
}
