// @ts-check
// Node.js version gate. The build tools run only on a Node.js release with the October 2026
// security fixes (CVE-2026-111497 "Node2Shell" in the Brotli decoder, and nine other CVEs).
// Bunker does not decompress anything, so the flaw does not reach this project today.
// The gate makes sure that it never can. See docs/security/supply-chain.md.
// Run: node tools/check-node.js
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

/** The first patched release of each supported line. Update this table after each Node.js security release. */
export const PATCHED = Object.freeze({ 22: '22.23.4', 24: '24.22.1', 26: '26.12.1' });
/** The release that the project tests with. Same as .nvmrc and the CI workflow. */
export const PINNED = '24.22.1';

/** @param {string} v */
function parts(v) {
  const m = /^v?(\d+)\.(\d+)\.(\d+)$/.exec(v);
  return m ? [Number(m[1]), Number(m[2]), Number(m[3])] : null;
}

/**
 * @param {number[]} a
 * @param {number[]} b
 */
function atLeast(a, b) {
  for (let i = 0; i < 3; i++) if (a[i] !== b[i]) return a[i] > b[i];
  return true;
}

/**
 * Return null if the version is safe to use, or a message that says why not.
 * @param {string} version for example "24.22.1"
 * @returns {string | null}
 */
export function nodeVersionProblem(version) {
  const v = parts(version);
  if (!v) return 'Unknown Node.js version "' + version + '".';
  const [major] = v;
  const newest = Math.max(...Object.keys(PATCHED).map(Number));
  if (major > newest) return null;
  const fixed = PATCHED[/** @type {22 | 24 | 26} */ (major)];
  if (!fixed) return 'Node.js ' + version + ' is not a supported release line. Install Node.js ' + PINNED + ' (LTS) from https://nodejs.org.';
  const p = parts(fixed);
  if (p && !atLeast(v, p)) return 'Node.js ' + version + ' has known security flaws. Install Node.js ' + fixed + ' or newer, or ' + PINNED + ' (LTS), from https://nodejs.org.';
  return null;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const problem = nodeVersionProblem(process.versions.node);
  if (problem) { console.error(problem); process.exit(1); }
  console.log('Node.js ' + process.versions.node + ' is a patched release.');
}
