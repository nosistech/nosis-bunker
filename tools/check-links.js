// @ts-check
// Explorer link check. It builds one link for each explorer template from the test addresses,
// opens each link, and reports the result. CI runs it once a week (.github/workflows/links.yml).
// This is the only script in the project that uses the network. The page itself never does.
// Run: node tools/check-links.js
//
// Security: this script reads only the HTTP status code. It uses node:https, which never
// decompresses a response, and it drops the response body unread. A hostile server cannot
// reach a decoder (for example the Brotli flaw CVE-2026-111497) through this script.
// See docs/security/supply-chain.md.
import { readFileSync } from 'node:fs';
import { request } from 'node:https';
import { nodeVersionProblem } from './check-node.js';
import { classify } from '../src/classify.js';
import { explorerUrl } from '../src/explorer.js';

const problem = nodeVersionProblem(process.versions.node);
if (problem) { console.error(problem); process.exit(1); }

const MAX_REDIRECTS = 5;

/**
 * Get the final HTTP status of a URL. Follows https redirects only. Reads no body.
 * @param {string} url
 * @param {number} [hops]
 * @returns {Promise<string>}
 */
function statusOf(url, hops = 0) {
  return new Promise(done => {
    const req = request(url, { method: 'GET', timeout: 20000, headers: { 'user-agent': 'nosis-bunker-link-check', 'accept-encoding': 'identity' } }, res => {
      const code = res.statusCode || 0;
      const next = res.headers.location;
      res.destroy();
      if (code >= 300 && code < 400 && next && hops < MAX_REDIRECTS) {
        const target = new URL(next, url);
        if (target.protocol !== 'https:') return done('error: redirect to ' + target.protocol);
        statusOf(target.href, hops + 1).then(done);
        return;
      }
      done(String(code));
    });
    req.on('timeout', () => req.destroy(new Error('timeout')));
    req.on('error', err => done('error: ' + err.message));
    req.end();
  });
}

const cases = JSON.parse(readFileSync(new URL('../test/fixtures/addresses.json', import.meta.url), 'utf8')).cases;

/** One link per explorer host and path pattern. */
const byPattern = new Map();
for (const c of cases) {
  const v = classify(c.address);
  const url = explorerUrl({ ...v, address: v.address || c.address });
  if (!url) continue;
  const u = new URL(url);
  const pattern = u.host + u.pathname.split('/').slice(0, -1).join('/');
  if (!byPattern.has(pattern)) byPattern.set(pattern, url);
}

let broken = 0;
for (const url of byPattern.values()) {
  const status = await statusOf(url);
  // 403, 429 and 503 often mean the site blocks bots. Report them, then check those links by hand.
  const ok = /^(2|3)\d\d$/.test(status);
  const blocked = /^(403|429|503)$/.test(status);
  if (!ok && !blocked) broken++;
  console.log((ok ? 'OK     ' : blocked ? 'BLOCKED' : 'BROKEN ') + ' ' + status.padEnd(5) + ' ' + url);
}
console.log(byPattern.size + ' explorer links checked, ' + broken + ' broken.');
process.exit(broken ? 1 : 0);
