// @ts-check
// Language and color theme. Both start from the settings of the visitor's system.
// Nothing is saved: the page has no storage (ADR-029). A link with #es opens the page in Spanish.
import { UI_TEXT } from './text.js';
import { UI_STATE } from './state.js';
import { uiById } from './dom.js';

/** @returns {'en' | 'es'} */
export function uiStartLang() {
  const hash = location.hash.toLowerCase();
  if (hash === '#es') return 'es';
  if (hash === '#en') return 'en';
  const langs = navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || 'en'];
  return /^es\b/i.test(langs[0] || '') ? 'es' : 'en';
}

/**
 * Show the static text of one language: the paired blocks, the labels and the attributes.
 * @param {'en' | 'es'} lang
 */
export function uiApplyLang(lang) {
  UI_STATE.lang = lang;
  const t = UI_TEXT[lang];
  document.documentElement.lang = lang;
  for (const node of document.querySelectorAll('[data-lang]')) {
    /** @type {HTMLElement} */ (node).hidden = node.getAttribute('data-lang') !== lang;
  }
  for (const node of document.querySelectorAll('[data-i18n]')) {
    const key = node.getAttribute('data-i18n') || '';
    if (typeof t[key] === 'string') node.textContent = t[key];
  }
  for (const node of document.querySelectorAll('[data-i18n-aria]')) {
    const key = node.getAttribute('data-i18n-aria') || '';
    if (typeof t[key] === 'string') node.setAttribute('aria-label', t[key]);
  }
  for (const node of document.querySelectorAll('[data-setlang]')) {
    node.setAttribute('aria-pressed', String(node.getAttribute('data-setlang') === lang));
  }
  /** @type {HTMLTextAreaElement} */ (uiById('addrs')).placeholder = t.placeholder;
  try {
    history.replaceState(null, '', location.pathname + location.search + (lang === 'es' ? '#es' : ''));
  } catch {
    // Some viewers block history changes. The language still changes on the page.
  }
  uiApplyThemeLabel();
}

/** @returns {'light' | 'dark'} */
function uiEffectiveTheme() {
  const set = document.documentElement.getAttribute('data-theme');
  if (set === 'light' || set === 'dark') return set;
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/** The theme button shows the theme you get when you select it. */
export function uiApplyThemeLabel() {
  const btn = uiById('theme');
  const mode = uiEffectiveTheme();
  const label = mode === 'dark' ? UI_TEXT[UI_STATE.lang].toLight : UI_TEXT[UI_STATE.lang].toDark;
  btn.setAttribute('data-mode', mode);
  btn.setAttribute('aria-label', label);
  btn.setAttribute('title', label);
}

export function uiToggleTheme() {
  document.documentElement.setAttribute('data-theme', uiEffectiveTheme() === 'dark' ? 'light' : 'dark');
  uiApplyThemeLabel();
}

export function uiWatchSystemTheme() {
  if (!window.matchMedia) return;
  const mq = window.matchMedia('(prefers-color-scheme: dark)');
  if (mq.addEventListener) mq.addEventListener('change', uiApplyThemeLabel);
}
