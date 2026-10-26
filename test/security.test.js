// Security tests on the built page. They put the OWASP rules in docs/security/owasp.md into code.
// If one of these tests fails, the build must not ship.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { buildPage } from '../tools/build.js';

const { html, script, styles, csp } = buildPage();
// Code without comments. Comments may name the banned functions to explain the rules.
const code = script.replace(/\/\*[\s\S]*?\*\//g, '').split('\n').filter(l => !l.trim().startsWith('//')).join('\n');
const sha = t => "'sha256-" + createHash('sha256').update(t, 'utf8').digest('base64') + "'";

test('the page has no network code (privacy promise)', () => {
  for (const banned of ['fetch(', 'XMLHttpRequest', 'WebSocket', 'EventSource', 'sendBeacon', 'import(', 'Worker(']) {
    assert.ok(!code.includes(banned), 'found ' + banned);
  }
});

test('the page stores nothing in the browser', () => {
  for (const banned of ['localStorage', 'sessionStorage', 'indexedDB', 'document.cookie', 'caches.']) {
    assert.ok(!code.includes(banned), 'found ' + banned);
  }
});

test('no dangerous DOM sinks or code evaluation (OWASP DOM XSS cheat sheet)', () => {
  const banned = ['.innerHTML', '.outerHTML', 'insertAdjacentHTML', 'document.write', 'eval(', 'new Function', 'setTimeout("', "setTimeout('", 'setInterval(', 'createContextualFragment', 'srcdoc'];
  for (const b of banned) assert.ok(!code.includes(b), 'found ' + b);
});

test('Content Security Policy is strict and its hashes match', () => {
  assert.ok(csp.includes("default-src 'none'"));
  assert.ok(csp.includes("connect-src 'none'"));
  assert.ok(csp.includes("require-trusted-types-for 'script'"));
  assert.ok(!csp.includes('unsafe-inline') && !csp.includes('unsafe-eval'));
  // Fonts and images may come only from data URLs inside the page. Never from a server.
  assert.ok(csp.includes("font-src data:;") && csp.includes("img-src data:;"));
  assert.ok(!/https?:/.test(csp), 'the CSP names a remote origin');
  assert.ok(csp.includes('script-src ' + sha(script)), 'script hash');
  assert.ok(csp.includes('style-src ' + sha(styles)), 'style hash');
  assert.ok(html.includes('<meta name="referrer" content="no-referrer">'));
});

test('the HTML loads nothing from outside and has one script and one style block', () => {
  // The one allowed resource tag is the tab icon, and it must be a data URL (no request).
  const icon = /<link rel="icon" href="data:image\/svg\+xml,[^"]+">/;
  assert.ok(icon.test(html), 'tab icon as a data URL');
  // The canonical link names the official address. The browser does not load it.
  const canonical = '<link rel="canonical" href="https://bunker.nosistech.com/">';
  assert.ok(html.includes(canonical));
  assert.ok(!/<(script|link|img|iframe|object|embed)[^>]+(src|href)=/i.test(html.replace(icon, '').replace(canonical, '')), 'external resource tag');
  assert.ok(!/url\(\s*['"]?(https?:)?\/\//i.test(styles), 'CSS loads a URL from outside');
  // One script that runs, and one block of structured data that does not run.
  assert.equal((html.match(/<script>/g) || []).length, 1);
  assert.equal((html.match(/<script/g) || []).length, 2);
  const ld = /<script type="application\/ld\+json">([^<]*)<\/script>/.exec(html);
  assert.ok(ld, 'structured data block');
  assert.equal(JSON.parse(ld[1])['@type'], 'SoftwareApplication');
  assert.equal((html.match(/<style/g) || []).length, 1);
  assert.ok(!/ on[a-z]+=/i.test(html.replace(script, '')), 'inline event handler attribute');
  assert.ok(!/ style="/i.test(html), 'inline style attribute (blocked by CSP)');
});

test('every link in the code gets rel="noopener noreferrer"', () => {
  const links = script.match(/uiEl\('a',[^)]*\)/g) || [];
  assert.ok(links.length > 0);
  for (const l of links) assert.ok(l.includes("rel: 'noopener noreferrer'"), l);
});

test('the build is reproducible', () => {
  assert.equal(buildPage().html, html);
});

test('no em dashes in the page or the docs (house style)', () => {
  assert.ok(!html.includes('—'), 'em dash in the page');
  const files = ['README.md', 'SECURITY.md', 'CONTRIBUTING.md', ...readdirSync('docs').filter(f => f.endsWith('.md')).map(f => join('docs', f)),
    ...readdirSync('docs/decisions').map(f => join('docs/decisions', f)), ...readdirSync('docs/security').map(f => join('docs/security', f))];
  for (const f of files) assert.ok(!readFileSync(f, 'utf8').includes('—'), 'em dash in ' + f);
});
