// Accessibility audit: axe-core (WCAG 2.0, 2.1 and 2.2, levels A and AA) plus interaction checks.
// This is a manual release step, not part of CI, so the project keeps zero dependencies (ADR-030).
// Steps are in docs/11-accessibility.md. Usage:
//   node audit/a11y-audit.cjs <path to dist/nosis-bunker.html> <path to axe.min.js>
// It needs Playwright with Chromium. It loads axe-core only into the test browser.
const { chromium } = require('playwright');
const axePath = process.argv[3];
if (!process.argv[2] || !axePath) { console.error('Usage: node audit/a11y-audit.cjs <page.html> <axe.min.js>'); process.exit(1); }
(async () => {
  const file = require('node:path').resolve(process.argv[2]);
  const b = await chromium.launch();
  let fails = 0;
  for (const [lang, scheme, vw] of [['en','light',1280],['en','dark',1280],['es','light',390],['es','dark',390]]) {
    const ctx = await b.newContext({ bypassCSP: true, colorScheme: scheme, viewport: { width: vw, height: 900 } });
    const p = await ctx.newPage();
    const errs = [];
    p.on('pageerror', e => errs.push(e.message));
    await p.goto('file://' + file + (lang === 'es' ? '#es' : ''));
    await p.evaluate(() => document.querySelectorAll('details').forEach(d => d.open = true));
    await p.addScriptTag({ path: axePath });
    const r = await p.evaluate(async () => await axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa','best-practice'] } }));
    console.log(`== ${lang} ${scheme} ${vw}px: ${r.violations.length} violations, ${r.passes.length} passes, lang=${await p.evaluate(()=>document.documentElement.lang)}`);
    for (const v of r.violations) { fails++; console.log(' -', v.id, v.impact, v.nodes.length, v.help, '|', v.nodes.slice(0,3).map(n => n.target.join(' ')).join(' ; ')); }
    if (errs.length) console.log(' page errors:', errs);
    await ctx.close();
  }
  // Interaction checks
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
  const p = await ctx.newPage();
  await p.goto('file://' + file);
  await p.fill('#addrs', 'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4 Savings');
  await p.click('#scan');
  await p.click('[data-setlang="es"]');
  console.log('after ES switch: text kept =', (await p.inputValue('#addrs')).includes('Savings'), '| verdict:', await p.textContent('#verdict'), '| h1 visible:', await p.locator('h1:visible').textContent());
  console.log('hash:', await p.evaluate(() => location.hash), 'html lang:', await p.evaluate(() => document.documentElement.lang));
  const before = await p.evaluate(() => getComputedStyle(document.body).backgroundColor);
  await p.click('#theme');
  const after = await p.evaluate(() => getComputedStyle(document.body).backgroundColor);
  console.log('theme toggled:', before, '->', after, '| label:', await p.getAttribute('#theme', 'aria-label'));
  // keyboard only: tab through first controls
  await p.goto('file://' + file);
  const seq = [];
  for (let i = 0; i < 9; i++) { await p.keyboard.press('Tab'); seq.push(await p.evaluate(() => { const a = document.activeElement; return a.id || a.getAttribute('data-setlang') || a.getAttribute('data-act') || a.textContent.trim().slice(0, 16); })); }
  console.log('tab order:', seq.join(' > '));
  await b.close();
  console.log(fails ? 'AXE VIOLATIONS: ' + fails : 'axe: clean');
  process.exitCode = fails ? 1 : 0;
})();
