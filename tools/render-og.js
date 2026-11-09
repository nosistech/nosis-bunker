// @ts-check
// Draw the social preview images from assets/social-card.html.
//
//   node tools/render-og.js
//
// Writes:
//   assets/og.png              1200x630, the image the website serves as /og.png
//   assets/github-social.png   1280x640, upload this by hand in GitHub Settings
//
// The script needs Google Chrome or Chromium on this computer. It is not part of
// npm run check. CI has no browser. tools/site.js copies the committed PNG into site/.
// Run this script again only when the card design changes, then commit both PNGs.
import { spawn } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const TEMPLATE = join(ROOT, 'assets/social-card.html');
const FONT = join(ROOT, 'src/ui/fonts/archivo-subset.woff2');

/** @param {string} path */
function pngSize(path) {
  const buf = readFileSync(path);
  const sig = '89504e470d0a1a0a';
  if (buf.subarray(0, 8).toString('hex') !== sig) throw new Error(path + ' is not a PNG');
  if (buf.toString('ascii', 12, 16) !== 'IHDR') throw new Error(path + ' has no IHDR');
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20), bytes: buf.length };
}

/**
 * @param {string} chrome
 * @param {string[]} args
 * @param {string} shot
 */
function draw(chrome, args, shot) {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(chrome, args, { stdio: ['ignore', 'ignore', 'pipe'] });
    let settled = false;
    /** @param {Error | null} err */
    const finish = (err) => {
      if (settled) return;
      settled = true;
      clearInterval(timer);
      try { child.kill('SIGKILL'); } catch { /* already gone */ }
      if (err) reject(err);
      else resolvePromise(undefined);
    };
    let last = -1;
    let stable = 0;
    const timer = setInterval(() => {
      let size = -1;
      try { size = statSync(shot).size; } catch { size = -1; }
      if (size > 2000 && size === last) {
        stable += 1;
        if (stable >= 2) finish(null);
      } else {
        stable = 0;
      }
      last = size;
    }, 300);
    child.on('error', err => finish(err));
    child.on('exit', () => {
      try {
        if (statSync(shot).size > 2000) finish(null);
      } catch { /* the poll will keep waiting until the timeout below */ }
    });
    setTimeout(() => finish(new Error('the browser did not write ' + shot)), 25000);
  });
}

/** @param {string} chrome @param {number} width @param {number} height @param {string} outFile */
async function render(chrome, width, height, outFile) {
  const dir = mkdtempSync(join(tmpdir(), 'bunker-og-'));
  try {
    const page = join(dir, 'card.html');
    const shot = join(dir, 'shot.png');
    const profile = join(dir, 'profile');
    mkdirSync(profile);
    // A data URL, not a file link. Chrome treats each file:// page as its own origin,
    // so a separate font file never loads and the card falls back to another face.
    const fontUrl = 'data:font/woff2;base64,' + readFileSync(FONT).toString('base64');
    const html = readFileSync(TEMPLATE, 'utf8')
      .split('__WIDTH__').join(String(width))
      .split('__HEIGHT__').join(String(height))
      .split('__FONT__').join(fontUrl);
    writeFileSync(page, html);
    const args = [
      '--headless=new',
      '--no-sandbox',
      '--disable-gpu',
      '--disable-dev-shm-usage',
      '--hide-scrollbars',
      '--force-device-scale-factor=1',
      '--allow-file-access-from-files',
      '--virtual-time-budget=10000',
      '--user-data-dir=' + profile,
      '--window-size=' + width + ',' + height,
      '--default-background-color=FFE8EAE5',
      '--screenshot=' + shot,
      'file://' + page,
    ];
    await draw(chrome, args, shot);
    const size = pngSize(shot);
    if (size.width !== width || size.height !== height) {
      throw new Error(outFile + ' came out ' + size.width + 'x' + size.height + ', wanted ' + width + 'x' + height);
    }
    writeFileSync(outFile, readFileSync(shot));
    console.log('Wrote ' + outFile + ' (' + size.width + 'x' + size.height + ', ' + size.bytes + ' bytes)');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

function chromeBin() {
  return process.env.CHROME || 'google-chrome';
}

async function main() {
  const chrome = chromeBin();
  await render(chrome, 1200, 630, join(ROOT, 'assets/og.png'));
  await render(chrome, 1280, 640, join(ROOT, 'assets/github-social.png'));
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(err => {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  });
}
