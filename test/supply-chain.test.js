// Supply-chain tests (OWASP Top 10:2025 A03 Software Supply Chain Failures).
// They keep the project free of npm packages, install scripts and unsafe Node.js versions.
// See docs/security/supply-chain.md.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { nodeVersionProblem, PATCHED, PINNED } from '../tools/check-node.js';
import { buildPage } from '../tools/build.js';
import { headersFile, readOgImage, OG_WIDTH, OG_HEIGHT } from '../tools/site.js';

const pkg = JSON.parse(readFileSync('package.json', 'utf8'));

/** @param {string} dir */
function jsFiles(dir) {
  return readdirSync(dir).flatMap(f => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? jsFiles(p) : p.endsWith('.js') ? [p] : [];
  });
}

test('the project has no npm dependencies of any kind', () => {
  for (const k of ['dependencies', 'devDependencies', 'optionalDependencies', 'peerDependencies', 'bundleDependencies', 'bundledDependencies']) {
    assert.ok(!(k in pkg), 'package.json has ' + k);
  }
  assert.ok(!existsSync('node_modules'), 'node_modules exists');
  if (existsSync('package-lock.json')) {
    const lock = JSON.parse(readFileSync('package-lock.json', 'utf8'));
    assert.deepEqual(Object.keys(lock.packages || {}).filter(k => k !== ''), [], 'package-lock.json lists packages');
  }
});

test('package.json has no install-time scripts', () => {
  // `build` is not an npm lifecycle name, but the git installer still runs
  // `npm install` inside the checkout when that key exists. A global install
  // then links the package to the temporary checkout and deletes the checkout,
  // so `bunker-mcp` never lands on PATH (P-47).
  for (const k of ['preinstall', 'install', 'postinstall', 'prepare', 'prepublish', 'prepublishOnly', 'prepack', 'postpack', 'build']) {
    assert.ok(!(k in (pkg.scripts || {})), 'script ' + k);
  }
});

test('npm is set to never run package scripts', () => {
  const npmrc = readFileSync('.npmrc', 'utf8');
  assert.match(npmrc, /^ignore-scripts=true$/m);
  assert.match(npmrc, /^engine-strict=true$/m);
});

test('code imports only Node.js built-ins and project files', () => {
  for (const f of [...jsFiles('src'), ...jsFiles('tools'), ...jsFiles('test'), ...jsFiles('cli'), ...jsFiles('mcp')]) {
    for (const m of readFileSync(f, 'utf8').matchAll(/^import [^'"]*['"]([^'"]+)['"]/gm)) {
      assert.ok(m[1].startsWith('node:') || m[1].startsWith('./') || m[1].startsWith('../'), f + ' imports ' + m[1]);
    }
  }
});

test('the tools never decompress data from the network (CVE-2026-111497 surface)', () => {
  for (const f of jsFiles('tools')) {
    const code = readFileSync(f, 'utf8').split('\n').filter(l => !l.trim().startsWith('//')).join('\n');
    assert.ok(!/node:zlib|\bfetch\(|createBrotli|brotliDecompress|node:http2/.test(code), f);
  }
});

test('the Node.js version gate', () => {
  assert.equal(nodeVersionProblem('24.22.1'), null);
  assert.equal(nodeVersionProblem('22.23.4'), null);
  assert.equal(nodeVersionProblem('26.12.1'), null);
  assert.equal(nodeVersionProblem('v24.23.0'), null);
  assert.equal(nodeVersionProblem('28.0.0'), null);
  for (const bad of ['24.22.0', '22.23.3', '26.12.0', '20.19.5', '23.11.0', '25.1.0', '18.20.0', 'abc']) {
    assert.ok(nodeVersionProblem(bad), bad + ' must fail');
  }
  assert.equal(readFileSync('.nvmrc', 'utf8').trim(), PINNED);
  assert.equal(PATCHED[24], PINNED);
});

test('the Node.js version that runs these tests is patched', () => {
  assert.equal(nodeVersionProblem(process.versions.node), null);
});

test('CI installs the pinned Node.js build and checks its SHA-256 hash', () => {
  for (const wf of ['.github/workflows/ci.yml', '.github/workflows/links.yml']) {
    const y = readFileSync(wf, 'utf8');
    assert.ok(y.includes('node-v' + PINNED + '-linux-x64.tar.xz'), wf + ' pinned version');
    assert.match(y, /sha256sum -c/, wf + ' hash check');
    assert.ok(!/uses:/.test(y), wf + ' uses a third-party action');
  }
});

test('the committed website matches a fresh build', () => {
  const { html, csp } = buildPage();
  assert.equal(readFileSync('site/index.html', 'utf8'), html);
  assert.equal(readFileSync('site/nosis-bunker.html', 'utf8'), html);
  assert.equal(readFileSync('site/_headers', 'utf8'), headersFile(csp));
  const digest = createHash('sha256').update(html, 'utf8').digest('hex');
  const sums = readFileSync('site/SHA256SUMS.txt', 'utf8');
  assert.ok(sums.startsWith(digest + '  index.html\n' + digest + '  nosis-bunker.html\n'));
  const og = readOgImage();
  assert.ok(readFileSync('site/og.png').equals(og), 'site/og.png must match assets/og.png');
  const ogDigest = createHash('sha256').update(og).digest('hex');
  assert.ok(sums.endsWith(ogDigest + '  og.png\n'));
  assert.match(readFileSync('site/.well-known/security.txt', 'utf8'), /^Contact: mailto:.+\n(Contact: .+\n)*Expires: \d{4}-/);
});

test('the link-card image and the GitHub social image have the sizes those sites ask for', () => {
  const og = readOgImage();
  assert.equal(og.readUInt32BE(16), OG_WIDTH);
  assert.equal(og.readUInt32BE(20), OG_HEIGHT);
  const gh = readFileSync('assets/github-social.png');
  assert.equal(gh.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
  assert.equal(gh.readUInt32BE(16), 1280);
  assert.equal(gh.readUInt32BE(20), 640);
  assert.ok(gh.length < 1024 * 1024, 'GitHub rejects a social preview above 1 MB');
});

test('the website headers are strict', () => {
  const h = readFileSync('site/_headers', 'utf8');
  for (const need of ["frame-ancestors 'none'", 'X-Content-Type-Options: nosniff', 'Strict-Transport-Security: max-age=63072000', 'no-transform', "connect-src 'none'", '! Access-Control-Allow-Origin']) {
    assert.ok(h.includes(need), need);
  }
  // og.png must be a normal image. Only the offline page is a download.
  for (const block of h.split(/\n\n+/)) {
    if (block.includes('Content-Disposition')) assert.match(block, /\/nosis-bunker/);
  }
  assert.ok(!h.includes('/og.png'));
});
