// @ts-check
// Website package for https://bunker.nosistech.com. Run after tools/build.js.
// It writes the folder site/, which a static host serves as it is. The host runs no build
// and no Node.js. See docs/security/hosting.md and docs/decisions/ADR-025-prebuilt-site.md.
//
// Output:
//   site/index.html                  the page, byte for byte the same as dist/nosis-bunker.html
//   site/nosis-bunker.html           the same file, for people who want to save it for offline use
//   site/SHA256SUMS.txt              the hash, so anyone can compare a copy
//   site/_headers                    HTTP security headers (Cloudflare Pages and Netlify read this file)
//   site/.well-known/security.txt    how to report a security problem (RFC 9116)
//   site/robots.txt                  lets search engines and AI agents read the site
//   site/llms.txt, site/networks.json, site/sitemap.xml   for AI agents and search engines (agent-files.js)
import { readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildPage } from './build.js';
import { llmsTxt, networksJson, sitemapXml } from './agent-files.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const SITE_ORIGIN = 'https://bunker.nosistech.com';
/** security.txt must have an end date (RFC 9116). Renew it each year. */
const SECURITY_TXT_EXPIRES = '2027-10-01T00:00:00.000Z'; // under one year, as RFC 9116 recommends
/** The date in sitemap.xml. A fixed date keeps the build reproducible. Change it with each release. */
export const SITE_DATE = '2026-10-25';

/**
 * The HTTP headers. The header CSP repeats the meta CSP from the page and adds the parts that
 * work only in a header (frame-ancestors). Both policies apply, so the strictest rule wins.
 * @param {string} csp the policy from buildPage()
 */
export function headersFile(csp) {
  const common = [
    'X-Content-Type-Options: nosniff',
    'Referrer-Policy: no-referrer',
    'X-Frame-Options: DENY',
    'Cross-Origin-Opener-Policy: same-origin',
    'Cross-Origin-Resource-Policy: same-origin',
    'Cross-Origin-Embedder-Policy: require-corp',
    'Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=(), serial=(), hid=(), bluetooth=(), clipboard-read=()',
    'Strict-Transport-Security: max-age=63072000; includeSubDomains',
  ];
  return [
    '# HTTP security headers for ' + SITE_ORIGIN + '. Made by tools/site.js. Do not edit by hand.',
    '/*',
    ...common.map(h => '  ' + h),
    "  Content-Security-Policy: " + csp + "; frame-ancestors 'none'",
    // no-cache: the browser and the CDN check for a new version on every visit (with the ETag),
    // so a security fix reaches every user at once. no-transform: the host must not change the
    // HTML, because a changed script breaks its CSP hash.
    '  Cache-Control: no-cache, no-transform',
    // Remove a header that Cloudflare Pages adds by default. "!" detaches a header.
    // The page needs no cross-origin reads, so it needs no Access-Control-Allow-Origin.
    // (Cloudflare also adds Report-To and NEL at its edge. A "!" line cannot remove those.
    // See docs/security/hosting.md.)
    '  ! Access-Control-Allow-Origin',
    '',
    // Cloudflare Pages sends /nosis-bunker.html to /nosis-bunker (308 redirect), so both paths get the rule.
    '/nosis-bunker.html',
    '  Content-Disposition: attachment; filename="nosis-bunker.html"',
    '',
    '/nosis-bunker',
    '  Content-Disposition: attachment; filename="nosis-bunker.html"',
    '',
  ].join('\n');
}

export function securityTxt() {
  return [
    'Contact: mailto:info@nosistech.com',
    'Contact: https://nosistech.com',
    'Expires: ' + SECURITY_TXT_EXPIRES,
    'Preferred-Languages: en, es',
    'Canonical: ' + SITE_ORIGIN + '/.well-known/security.txt',
    'Policy: https://github.com/nosistech/nosis-bunker/blob/main/SECURITY.md',
    '',
  ].join('\n');
}

function main() {
  const { html, csp } = buildPage();
  const built = readFileSync(join(ROOT, 'dist/nosis-bunker.html'), 'utf8');
  if (built !== html) throw new Error('site: dist/nosis-bunker.html is out of date. Run node tools/build.js first.');
  const out = join(ROOT, 'site');
  rmSync(out, { recursive: true, force: true });
  mkdirSync(join(out, '.well-known'), { recursive: true });
  writeFileSync(join(out, 'index.html'), html);
  writeFileSync(join(out, 'nosis-bunker.html'), html);
  const digest = createHash('sha256').update(html, 'utf8').digest('hex');
  writeFileSync(join(out, 'SHA256SUMS.txt'), digest + '  index.html\n' + digest + '  nosis-bunker.html\n');
  writeFileSync(join(out, '_headers'), headersFile(csp));
  writeFileSync(join(out, '.well-known/security.txt'), securityTxt());
  writeFileSync(join(out, 'robots.txt'), 'User-agent: *\nAllow: /\n\nSitemap: ' + SITE_ORIGIN + '/sitemap.xml\n');
  const version = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')).version;
  writeFileSync(join(out, 'llms.txt'), llmsTxt(SITE_ORIGIN, version));
  writeFileSync(join(out, 'networks.json'), networksJson(SITE_ORIGIN));
  writeFileSync(join(out, 'sitemap.xml'), sitemapXml(SITE_ORIGIN, SITE_DATE));
  console.log('Wrote site/ for ' + SITE_ORIGIN + '. SHA-256 of the page: ' + digest);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
