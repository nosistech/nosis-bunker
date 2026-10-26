// @ts-check
// Build explorer links and network labels for a classified entry.
// Security: a link is returned only if it is a valid https URL. See docs/security/owasp.md.
import { CHAINS } from './chains.js';
import { MODEL } from './model.js';

/**
 * @param {{ chain: string | null, model: string, address: string, explorer?: string | null, noLink?: boolean }} entry
 * @returns {string | null}
 */
export function explorerUrl(entry) {
  if (entry.model === MODEL.XPUB || entry.noLink) return null;
  const chain = entry.chain ? CHAINS[entry.chain] : undefined;
  const template = entry.explorer !== undefined ? entry.explorer : chain && chain.explorer;
  if (!template) return null;
  const href = template.replace('{a}', encodeURIComponent(entry.address));
  try {
    const url = new URL(href);
    return url.protocol === 'https:' ? url.href : null;
  } catch {
    return null;
  }
}

/**
 * @param {{ chain: string | null, chainLabel?: string }} entry
 * @returns {string}
 */
export function chainLabel(entry) {
  if (entry.chainLabel) return entry.chainLabel;
  return entry.chain && CHAINS[entry.chain] ? CHAINS[entry.chain].name : 'Unknown';
}
