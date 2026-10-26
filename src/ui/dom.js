// @ts-check
// Safe DOM helpers for the page. Security rules (OWASP DOM-based XSS Prevention Cheat Sheet):
//   1. Never use innerHTML, outerHTML, insertAdjacentHTML or document.write. Text goes in with textContent.
//   2. Links come only from explorerUrl(), which returns https URLs or null.
//   3. Every external link has rel="noopener noreferrer".
// test/security.test.js fails the build if a rule is broken.

/**
 * Build an element. Text goes through textContent only.
 * @param {string} tag
 * @param {Record<string, string>} [attrs]
 * @param {(Node | string | null)[]} [children]
 * @returns {HTMLElement}
 */
export function uiEl(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'text') node.textContent = v;
    else if (k === 'class') node.className = v;
    else node.setAttribute(k, v);
  }
  for (const c of children) if (c !== null) node.append(c);
  return node;
}

/** @param {string} id */
export function uiById(id) {
  const node = document.getElementById(id);
  if (!node) throw new Error('Missing element: ' + id);
  return node;
}

const UI_SVG_NS = 'http://www.w3.org/2000/svg';
/** Icon shapes. Each shape is a list of [element, attributes]. Drawn with DOM methods only. */
const UI_ICONS = {
  locked: [['rect', { x: '4.5', y: '10.5', width: '15', height: '10', rx: '2.5' }], ['path', { d: 'M8 10.5V7.5a4 4 0 0 1 8 0v3' }]],
  open: [['rect', { x: '4.5', y: '10.5', width: '15', height: '10', rx: '2.5' }], ['path', { d: 'M8 10.5V7.5a4 4 0 0 1 7.6-1.8' }]],
  question: [['circle', { cx: '12', cy: '12', r: '8.5' }], ['path', { d: 'M9.7 9.6a2.4 2.4 0 1 1 3.4 2.2c-.7.3-1.1.8-1.1 1.6v.4' }], ['path', { d: 'M12 16.8v.1' }]],
  dash: [['circle', { cx: '12', cy: '12', r: '8.5' }], ['path', { d: 'M8.5 12h7' }]],
};

/** @param {string} name one of the UI_ICONS keys */
export function uiIcon(name) {
  const svg = document.createElementNS(UI_SVG_NS, 'svg');
  for (const [k, v] of Object.entries({ viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2', 'stroke-linecap': 'round', 'aria-hidden': 'true', focusable: 'false' })) svg.setAttribute(k, v);
  for (const [tag, attrs] of UI_ICONS[name] || UI_ICONS.dash) {
    const part = document.createElementNS(UI_SVG_NS, tag);
    for (const [k, v] of Object.entries(attrs)) part.setAttribute(k, v);
    svg.append(part);
  }
  return svg;
}

/** @param {number} n */
export function uiMoney(n) {
  return '$' + Math.round(n).toLocaleString('en-US');
}
