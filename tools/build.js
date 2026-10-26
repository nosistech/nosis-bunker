// @ts-check
// Build: join the source modules into ONE offline HTML file, dist/nosis-bunker.html.
// No dependencies. Only Node built-ins. See docs/decisions/ADR-005-build-script.md.
//
// What this script does, in order:
//   1. Start at src/ui/app.js and follow the imports to find every module.
//   2. Put the modules in dependency order (a module comes after the modules it imports).
//   3. Remove the import lines and the "export" keywords. Stop if a module uses any other module syntax.
//   4. Stop if two modules declare the same top-level name (they share one scope after the join).
//   5. Wrap the result in one function so nothing leaks to the global scope.
//   6. Embed the font file (after a check of its pinned SHA-256 hash), the icon and the version.
//   7. Compute SHA-256 hashes of the script and the styles, and write them into the Content Security Policy.
//   8. Write dist/nosis-bunker.html and dist/SHA256SUMS.txt. The output is the same on every run.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const ENTRY = join(ROOT, 'src/ui/app.js');
const IMPORT_LINE = /^import \{([^}]+)\} from '(\.{1,2}\/[^']+\.js)';$/;
// The font is a binary file from outside the project. The build stops if its bytes change.
// To update the font on purpose, follow docs/decisions/ADR-024-embedded-font.md and change this hash.
const FONT_FILE = join(ROOT, 'src/ui/fonts/archivo-subset.woff2');
const FONT_SHA256 = '7338cf2748ef1408457b9278edcfc12e8de800b5e0546423eb8705510286cd35';
// The tab icon: a closed lock on a cobalt square. An SVG data URL, so it needs no request.
const FAVICON_SVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="8" fill="#2238C2"/>'
  + '<rect x="9" y="14" width="14" height="11" rx="2.5" fill="#fff"/><path d="M12 14v-3a4 4 0 0 1 8 0v3" fill="none" stroke="#fff" stroke-width="2.6"/></svg>';
const TOP_LEVEL_NAME = /^(?:export )?(?:async )?(?:function\*? |const |let |class )([A-Za-z_$][\w$]*)/;

/** @param {string} msg */
function fail(msg) {
  throw new Error('build: ' + msg);
}

/**
 * Read a module, check its syntax rules, and return its imports.
 * @param {string} file absolute path
 */
function readModule(file) {
  const text = readFileSync(file, 'utf8');
  const imports = [];
  const body = [];
  for (const line of text.split('\n')) {
    if (line.startsWith('import ')) {
      const m = IMPORT_LINE.exec(line);
      if (!m) fail(relative(ROOT, file) + ': unsupported import form: ' + line);
      imports.push(resolve(dirname(file), m[2]));
      continue;
    }
    if (/^export (default|\{|\*)/.test(line)) fail(relative(ROOT, file) + ': only "export const|function|let" is allowed: ' + line);
    // Type notes in comments may say import('...'). Real code may not.
    const code = /^\s*(\/\/|\/?\*)/.test(line) ? '' : line.replace(/\/\*.*?\*\//g, '');
    if (/\bimport\s*\(/.test(code)) fail(relative(ROOT, file) + ': dynamic import is not allowed');
    body.push(line.replace(/^export /, ''));
  }
  return { file, imports, body: body.join('\n') };
}

/** Collect modules in dependency order (depth-first, post-order). */
function collectModules() {
  /** @type {Map<string, ReturnType<typeof readModule>>} */
  const done = new Map();
  const visiting = new Set();
  /** @param {string} file */
  const visit = file => {
    if (done.has(file)) return;
    if (visiting.has(file)) fail('import cycle at ' + relative(ROOT, file));
    visiting.add(file);
    const mod = readModule(file);
    mod.imports.forEach(visit);
    visiting.delete(file);
    done.set(file, mod);
  };
  visit(ENTRY);
  return [...done.values()];
}

/** @param {ReturnType<typeof collectModules>} modules */
function checkUniqueNames(modules) {
  /** @type {Map<string, string>} */
  const owner = new Map();
  for (const mod of modules) {
    for (const line of mod.body.split('\n')) {
      const m = TOP_LEVEL_NAME.exec(line);
      if (!m) continue;
      const name = m[1];
      const where = relative(ROOT, mod.file);
      if (owner.has(name)) fail('top-level name "' + name + '" is in ' + owner.get(name) + ' and ' + where);
      owner.set(name, where);
    }
  }
}

/**
 * Structured data (schema.org) so that search engines and AI agents can read what the page is.
 * The browser does not run it: the type is application/ld+json.
 * @param {string} version
 */
function jsonLd(version) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Bunker by NosisTech',
    alternateName: 'Bunker',
    url: 'https://bunker.nosistech.com/',
    description: 'Offline scanner that shows which crypto addresses expose their public key, with a calm, step-by-step plan to hide what you can. More than 100 networks. Runs on your device and sends nothing.',
    applicationCategory: 'SecurityApplication',
    operatingSystem: 'Any modern web browser. The CLI and the MCP server need Node.js 22.23.4 or later.',
    softwareVersion: version,
    inLanguage: ['en', 'es'],
    isAccessibleForFree: true,
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    license: 'https://www.apache.org/licenses/LICENSE-2.0',
    downloadUrl: 'https://bunker.nosistech.com/nosis-bunker.html',
    sameAs: ['https://github.com/nosistech/nosis-bunker'],
    author: { '@type': 'Person', name: 'Carlos A. Paredes Vargas' },
    publisher: { '@type': 'Organization', name: 'NosisTech LLC', url: 'https://nosistech.com', email: 'info@nosistech.com' },
    accessibilityFeature: ['fullKeyboardControl', 'readingOrder', 'structuralNavigation'],
    accessibilityHazard: 'none',
    featureList: ['100+ networks with checksum validation', 'Secret guard that blocks seed phrases and private keys', 'Step-by-step plan', 'English and Spanish', 'CLI with JSON output', 'Local MCP server for AI agents'],
  };
  // "<" is escaped, so the data can never close the script element.
  return JSON.stringify(data).replace(/</g, '\\u003c');
}

/** @param {string} text */
function sha256Base64(text) {
  return createHash('sha256').update(text, 'utf8').digest('base64');
}

/** Build the page in memory. Tests call this function. */
export function buildPage() {
  const modules = collectModules();
  checkUniqueNames(modules);
  const parts = modules.map(m => '// ---- ' + relative(ROOT, m.file).replace(/\\/g, '/') + ' ----\n' + m.body.trim());
  const script = '\n(() => {\n\'use strict\';\n' + parts.join('\n\n') + '\n})();\n';
  const font = readFileSync(FONT_FILE);
  if (createHash('sha256').update(font).digest('hex') !== FONT_SHA256) fail('the font file does not match its pinned SHA-256 hash');
  const css = readFileSync(join(ROOT, 'src/ui/styles.css'), 'utf8').trim();
  if (css.split('__FONT_ARCHIVO__').length !== 2) fail('styles.css must contain __FONT_ARCHIVO__ exactly once');
  const styles = '\n' + css.split('__FONT_ARCHIVO__').join('data:font/woff2;base64,' + font.toString('base64')) + '\n';
  const version = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')).version;
  if (!/^\d+\.\d+\.\d+$/.test(version)) fail('package.json version must be x.y.z');
  const favicon = 'data:image/svg+xml,' + encodeURIComponent(FAVICON_SVG);
  const jsonld = jsonLd(version);
  if (/<\/script/i.test(script)) fail('the script contains "</script"');
  if (/<\/style/i.test(styles)) fail('the styles contain "</style"');
  const csp = [
    "default-src 'none'",
    "script-src 'sha256-" + sha256Base64(script) + "'",
    "style-src 'sha256-" + sha256Base64(styles) + "'",
    "img-src data:",
    "font-src data:",
    "connect-src 'none'",
    "object-src 'none'",
    "base-uri 'none'",
    "form-action 'none'",
    "require-trusted-types-for 'script'",
    "trusted-types 'none'",
  ].join('; ');
  const template = readFileSync(join(ROOT, 'src/ui/template.html'), 'utf8');
  for (const p of ['__CSP__', '__STYLES__', '__SCRIPT__', '__FAVICON__', '__VERSION__', '__JSONLD__']) {
    if (template.split(p).length !== 2) fail('template must contain ' + p + ' exactly once');
  }
  // split/join, not replace(): a "$" in the code must not act as a replacement pattern.
  const html = template.split('__FAVICON__').join(favicon).split('__VERSION__').join(version).split('__JSONLD__').join(jsonld)
    .split('__CSP__').join(csp).split('__STYLES__').join(styles).split('__SCRIPT__').join(script);
  const left = /__[A-Z0-9_]+__/.exec(html.replace(script, '').replace(styles, ''));
  if (left) fail('the template has a placeholder with no value: ' + left[0]);
  return { html, script, styles, csp, modules: modules.map(m => relative(ROOT, m.file).replace(/\\/g, '/')) };
}

function main() {
  const { html, modules } = buildPage();
  const outDir = join(ROOT, 'dist');
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, 'nosis-bunker.html'), html);
  const digest = createHash('sha256').update(html, 'utf8').digest('hex');
  writeFileSync(join(outDir, 'SHA256SUMS.txt'), digest + '  nosis-bunker.html\n');
  console.log('Built dist/nosis-bunker.html from ' + modules.length + ' modules.');
  console.log('SHA-256: ' + digest);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
