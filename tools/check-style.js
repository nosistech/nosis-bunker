// @ts-check
// Writing check for the docs. Rules from docs/WRITING-STYLE.md:
//   - Fail: an em dash anywhere (house rule).
//   - Report: sentences longer than 25 words outside code blocks and tables (the limit for descriptions).
// Run: node tools/check-style.js
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const MAX_WORDS = 25;

/** @param {string} dir @returns {string[]} */
function markdownFiles(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name === 'dist' || name.startsWith('.git')) continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...markdownFiles(p));
    else if (name.endsWith('.md')) out.push(p);
  }
  return out;
}

/** @param {string} text */
function proseOnly(text) {
  return text
    .replace(/```[\s\S]*?```/g, '')
    .split('\n')
    .filter(l => !l.trim().startsWith('|') && !l.trim().startsWith('#'))
    .join('\n')
    .replace(/`[^`]*`/g, 'CODE')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1');
}

let failed = false;
let longCount = 0;
for (const file of markdownFiles('.')) {
  const text = readFileSync(file, 'utf8');
  if (text.includes('—')) {
    console.error('FAIL ' + file + ': contains an em dash');
    failed = true;
  }
  const sentences = proseOnly(text).split(/(?<=[.!?])\s+|\n\s*\n|\n[-*] /);
  for (const s of sentences) {
    const words = s.trim().split(/\s+/).filter(w => /[A-Za-z0-9]/.test(w));
    if (words.length > MAX_WORDS) {
      longCount++;
      console.log('LONG ' + file + ' (' + words.length + ' words): ' + s.trim().slice(0, 90) + '...');
    }
  }
}
console.log(longCount + ' sentence(s) longer than ' + MAX_WORDS + ' words. These are reported, not failed.');
process.exit(failed ? 1 : 0);
