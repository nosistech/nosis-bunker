// @ts-check
// One report object for machines: the CLI, the MCP server and networks.json use it.
// The shape is stable. Version 1. A change that removes or renames a field needs version 2.
// See docs/10-agents.md and docs/decisions/ADR-027-agent-interfaces.md.
import { parseInput, isUnrecognized, MAX_INPUT_CHARS, MAX_LINES } from '../parse.js';
import { statusOf, STATUS, MODEL } from '../model.js';
import { explorerUrl, chainLabel } from '../explorer.js';
import { buildPlan, planText, PLAN_DISCLAIMER } from '../plan.js';
import { CHAINS } from '../chains.js';
import { translatorFor } from '../i18n/translate.js';

export const REPORT_SCHEMA_VERSION = 1;
export const TOOL_URL = 'https://bunker.nosistech.com';
export const ATTRIBUTION = 'Results by Bunker by NosisTech (https://bunker.nosistech.com). Please keep this credit when you show or share them.';

/**
 * An unrecognized token is shown to agents in a short form only: it could be a secret in a format
 * that the guard does not know. The page shows it in full, because the page is the user's own screen.
 * @param {string} a
 */
function redact(a) {
  return a.length > 12 ? a.slice(0, 6) + '...' + a.slice(-3) + ' (' + a.length + ' characters)' : a;
}

/** The question for an address whose status depends on its history. */
const REPORT_QUESTION = Object.freeze({
  en: 'Has this address ever sent a transaction or signed a message? Answer yes or no.',
  es: '¿Esta dirección alguna vez envió una transacción o firmó un mensaje? Responde sí o no.',
});

/** What each exposure model means, for agents that read the raw value. */
export const MODEL_INFO = Object.freeze({
  [MODEL.HIDDEN_UNTIL_USED]: 'The public key is hidden until the address sends or signs for the first time.',
  [MODEL.VISIBLE]: 'The public key is visible from day one. A new address of the same type does not hide it.',
  [MODEL.HASH_SAFE]: 'No elliptic-curve public key is exposed (for example BIP-360 outputs).',
  [MODEL.ASK_PROVIDER]: 'The answer depends on the provider or the pool, not on the address.',
  [MODEL.MOVE_POOL]: 'The pool is at risk and a safer pool exists.',
  [MODEL.XPUB]: 'An extended public key. It exposes the public key of every address in a wallet.',
  [MODEL.UNKNOWN]: 'Not rated: unknown format, test network, typo, or not a wallet.',
});

/**
 * @typedef {{ ok: true, report: object } | { ok: false, code: string, message: string }} ReportResult
 */

/**
 * Scan text (one address on each line, optional label after a space) and build the report.
 * @param {string} text
 * @param {{ lang?: string, answers?: Record<string, string> }} [opt] answers: address -> 'yes' | 'no' | 'unsure'
 * @returns {ReportResult}
 */
export function buildReport(text, opt = {}) {
  const lang = opt.lang === 'es' ? 'es' : 'en';
  const tr = translatorFor(lang);
  const es = lang === 'es';
  if (typeof text !== 'string') return { ok: false, code: 'INVALID_INPUT', message: es ? 'La entrada debe ser texto.' : 'The input must be text.' };
  if (text.length > MAX_INPUT_CHARS) {
    return { ok: false, code: 'INPUT_TOO_LARGE', message: es ? 'La entrada tiene más de ' + MAX_INPUT_CHARS + ' caracteres.' : 'The input is longer than ' + MAX_INPUT_CHARS + ' characters.' };
  }
  const res = parseInput(text);
  // The secret itself is never repeated in the output.
  if (res.secret) {
    const message = es
      ? 'La entrada parece ' + tr(res.secret) + '. No se procesó, guardó ni envió nada. Usa solo direcciones públicas. Nunca compartas una frase semilla ni una clave privada.'
      : 'The input looks like ' + res.secret + '. Nothing was processed, stored or sent. Use public addresses only. Never share a seed phrase or private key.';
    return { ok: false, code: 'SECRET_DETECTED', message };
  }
  const answers = opt.answers || {};
  const entries = res.entries.map(e => {
    const a = answers[e.address];
    return a === 'yes' || a === 'no' || a === 'unsure' ? { ...e, sent: a } : e;
  });
  const results = entries.map(e => {
    const status = statusOf(e);
    return {
      address: isUnrecognized(e) ? redact(e.address) : e.address,
      label: e.label,
      network: tr(chainLabel(e)),
      networkId: e.chain,
      type: tr(e.type),
      model: e.model,
      status,
      explanation: tr(e.why),
      question: e.model === MODEL.HIDDEN_UNTIL_USED && status === STATUS.CHECK ? REPORT_QUESTION[lang] : null,
      networkChoices: e.options || null,
      explorerUrl: explorerUrl(e),
    };
  });
  const count = s => results.filter(r => s.includes(r.status)).length;
  const groups = buildPlan(entries);
  return {
    ok: true,
    report: {
      schemaVersion: REPORT_SCHEMA_VERSION,
      tool: { name: 'Bunker by NosisTech', url: TOOL_URL },
      language: lang,
      truncated: res.truncated || res.entries.length >= MAX_LINES,
      summary: {
        total: results.length,
        lockVisible: count([STATUS.EXPOSED]),
        checkNeeded: count([STATUS.CHECK, STATUS.WARNING]),
        lockHidden: count([STATUS.HIDDEN, STATUS.PROTECTED]),
        notRated: count([STATUS.UNKNOWN]),
      },
      results,
      plan: groups.map(g => ({ title: tr(g.title), items: g.items.map(it => ({ address: it.entry ? it.entry.address : null, text: tr(it.text) })) })),
      planText: planText(groups, { tr, title: lang === 'es' ? 'PLAN BUNKER' : 'BUNKER PLAN' }),
      disclaimer: tr(PLAN_DISCLAIMER),
      attribution: ATTRIBUTION,
    },
  };
}

/** The list of networks, for list_networks and /networks.json. */
export function listNetworks() {
  return {
    schemaVersion: REPORT_SCHEMA_VERSION,
    tool: { name: 'Bunker by NosisTech', url: TOOL_URL },
    models: MODEL_INFO,
    networks: Object.entries(CHAINS).map(([id, c]) => ({ id, name: c.name, accountStyle: c.family, canChangeKey: Boolean(c.rotate), explorer: c.explorer ? c.explorer.replace('{a}', '{address}') : null })),
    note: 'Many more networks are recognized by address format (for example about 45 Cosmos networks and Substrate networks by prefix). Scan an address to see its result.',
    attribution: ATTRIBUTION,
  };
}
