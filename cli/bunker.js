#!/usr/bin/env node
// @ts-check
// Bunker command-line tool. Offline. No network code, no files written.
// Usage: node cli/bunker.js --help
// Exit codes: 0 done, 1 usage error, 2 secret found (nothing processed), 3 input error.
import { readFileSync, openSync, readSync, fstatSync, closeSync } from 'node:fs';
import { buildReport, listNetworks } from '../src/agent/report.js';
import { MAX_INPUT_CHARS } from '../src/parse.js';
import { nodeVersionProblem } from '../tools/check-node.js';

/** The most bytes the tool reads from a file or standard input. More than this is not an address list. */
const MAX_READ_BYTES = MAX_INPUT_CHARS * 4 + 1;

const HELP = `Bunker by NosisTech: which crypto addresses show their public key.

Usage:
  node cli/bunker.js [options] [file ...]
  cat addresses.txt | node cli/bunker.js --json

Input: one public address on each line. An optional label can follow after a space.
With no file, the tool reads standard input.

Options:
  --json                 JSON output (the default when the output is not a terminal)
  --text                 The plan as plain text
  --lang en|es           Language of the explanations (default: en)
  --sent ADDRESS=ANSWER  Answer for an address: yes, no or unsure. Repeat for more addresses.
  --networks             Print the supported networks as JSON
  --version              Print the version
  --help                 Print this help

Exit codes: 0 done, 1 usage error, 2 a seed phrase or private key was found (nothing was processed), 3 input error.
Never give this tool a seed phrase or a private key. It needs public addresses only.`;

/** @param {string[]} argv */
function parseArgs(argv) {
  const opt = { format: process.stdout.isTTY ? 'text' : 'json', lang: 'en', answers: /** @type {Record<string, string>} */ ({}), files: /** @type {string[]} */ ([]), mode: 'scan' };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--json') opt.format = 'json';
    else if (a === '--text') opt.format = 'text';
    else if (a === '--networks') opt.mode = 'networks';
    else if (a === '--version') opt.mode = 'version';
    else if (a === '--help' || a === '-h') opt.mode = 'help';
    else if (a === '--lang') {
      const v = argv[++i];
      if (v !== 'en' && v !== 'es') throw new Error('--lang must be en or es');
      opt.lang = v;
    } else if (a === '--sent') {
      const m = /^([^=\s]+)=(yes|no|unsure)$/.exec(argv[++i] || '');
      if (!m) throw new Error('--sent must look like ADDRESS=yes, ADDRESS=no or ADDRESS=unsure');
      opt.answers[m[1]] = m[2];
    } else if (a.startsWith('-') && a !== '-') throw new Error('Unknown option: ' + a);
    else opt.files.push(a);
  }
  return opt;
}

/** @param {unknown} err @returns {string} */
function codeOf(err) {
  return err && typeof err === 'object' && 'code' in err ? String(err.code) : 'error';
}

/**
 * Read a file descriptor with a cap, so a device such as /dev/zero or an endless pipe cannot hang the tool.
 * @param {number} fd
 */
function readCapped(fd) {
  const chunks = [];
  let total = 0;
  const buf = Buffer.alloc(65536);
  for (;;) {
    let n;
    try {
      n = readSync(fd, buf, 0, buf.length, null);
    } catch (err) {
      if (codeOf(err) === 'EAGAIN') continue;
      if (codeOf(err) === 'EOF') break;
      throw err;
    }
    if (n === 0) break;
    chunks.push(Buffer.from(buf.subarray(0, n)));
    total += n;
    if (total > MAX_READ_BYTES) throw Object.assign(new Error('input too large'), { code: 'INPUT_TOO_LARGE' });
  }
  return Buffer.concat(chunks).toString('utf8');
}

/** @param {string} path */
function readFileCapped(path) {
  const fd = openSync(path, 'r');
  try {
    if (!fstatSync(fd).isFile()) throw Object.assign(new Error('not a regular file'), { code: 'NOT_A_FILE' });
    return readCapped(fd);
  } finally {
    closeSync(fd);
  }
}

function readStdin() {
  try {
    return readCapped(0);
  } catch (err) {
    if (codeOf(err) === 'INPUT_TOO_LARGE') throw err;
    return '';
  }
}

/** @param {object} value */
function printJson(value) {
  process.stdout.write(JSON.stringify(value, null, 2) + '\n');
}

function main() {
  let opt;
  try {
    opt = parseArgs(process.argv.slice(2));
  } catch (err) {
    process.stderr.write('bunker: ' + (err instanceof Error ? err.message : String(err)) + '\nRun with --help for usage.\n');
    return 1;
  }
  if (opt.mode === 'help') { process.stdout.write(HELP + '\n'); return 0; }
  if (opt.mode === 'version') {
    const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
    process.stdout.write(pkg.version + '\n');
    return 0;
  }
  if (opt.mode === 'networks') { printJson(listNetworks()); return 0; }
  const nodeProblem = nodeVersionProblem(process.versions.node);
  if (nodeProblem) process.stderr.write('bunker: warning: ' + nodeProblem + '\n');
  let text;
  try {
    text = opt.files.length ? opt.files.map(f => (f === '-' ? readStdin() : readFileCapped(f))).join('\n') : readStdin();
  } catch (err) {
    const code = codeOf(err);
    const known = code === 'INPUT_TOO_LARGE' || code === 'NOT_A_FILE';
    const message = code === 'INPUT_TOO_LARGE' ? 'The input is larger than ' + MAX_READ_BYTES + ' bytes.' : code === 'NOT_A_FILE' ? 'The path is not a regular file.' : 'Could not read the input: ' + code;
    if (opt.format === 'json') printJson({ ok: false, error: { code: known ? code : 'READ_ERROR', message } });
    else process.stderr.write('bunker: ' + message + '\n');
    return 3;
  }
  const res = buildReport(text, { lang: opt.lang, answers: opt.answers });
  if (!res.ok) {
    if (opt.format === 'json') printJson({ ok: false, error: { code: res.code, message: res.message } });
    else process.stderr.write('bunker: ' + res.message + '\n');
    return res.code === 'SECRET_DETECTED' ? 2 : 3;
  }
  if (opt.format === 'json') printJson({ ok: true, ...res.report });
  else process.stdout.write(/** @type {{ planText: string }} */ (res.report).planText + '\n');
  return 0;
}

process.exitCode = main();
