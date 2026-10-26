// @ts-check
// Page text in English and Spanish. Short labels only. Long text (headline, field guide,
// footer) is in template.html as paired blocks with data-lang="en" and data-lang="es".
// test/i18n.test.js checks that both languages have the same keys.

export const UI_TEXT = Object.freeze({
  en: Object.freeze({
    skip: 'Skip to the scanner',
    inLabel: 'Your addresses',
    placeholder: 'One address on each line. Add a label after a space:\nbc1q... Savings\n0x... Daily wallet',
    scan: 'Scan addresses',
    example: 'Load example',
    clear: 'Clear',
    kbd: 'Ctrl + Enter to scan',
    help: 'Paste public addresses only. Never paste a seed phrase or private key into any website.',
    resH: 'Your locks',
    exBanner: 'Example data. These are public test addresses with made-up values.',
    clearExample: 'Clear the example',
    planH: 'Your Bunker plan',
    copy: 'Copy plan',
    print: 'Print',
    copied: 'The plan is copied.',
    copyFallback: 'Select all of the text above and copy it.',
    guideH: 'Field guide',
    line: 'line',
    lines: 'lines',
    empty: 'Paste your addresses above and select Scan addresses. Your results and your plan show here.',
    noLabel: 'No label',
    netQ: 'Which network is this?',
    sentQ: 'Has it ever sent a transaction or signed a message?',
    notSure: 'Not sure',
    no: 'No',
    yes: 'Yes',
    valuePh: 'Value, optional',
    valueAria: 'Value in US dollars, optional',
    explorer: 'Open in explorer',
    remove: 'Remove',
    toDark: 'Switch to dark mode',
    toLight: 'Switch to light mode',
    langGroup: 'Language',
    footerNav: 'Footer',
    planTitle: 'BUNKER PLAN',
    secretIs: 'This looks like {what}. The page cleared it.',
    prefixHint: 'If it is an address, put 0x in front for Sui, Aptos or IOTA. For a NEAR implicit account, put near: in front. That prefix is a Bunker convention, so the 64 hex characters are not mistaken for a key.',
    neverSent: 'This page did not send it anywhere. Real tools need only your public address. Anybody who asks for a seed phrase or private key wants to empty your wallet.',
    exampleLabels: Object.freeze(['Ordinals', 'BTC savings', 'Daily wallet', 'SOL staking', 'DOT']),
  }),
  es: Object.freeze({
    skip: 'Ir al escáner',
    inLabel: 'Tus direcciones',
    placeholder: 'Una dirección por línea. Agrega una etiqueta después de un espacio:\nbc1q... Ahorros\n0x... Billetera diaria',
    scan: 'Revisar direcciones',
    example: 'Cargar ejemplo',
    clear: 'Borrar',
    kbd: 'Ctrl + Enter para revisar',
    help: 'Pega solo direcciones públicas. Nunca pegues una frase semilla ni una clave privada en ningún sitio web.',
    resH: 'Tus candados',
    exBanner: 'Datos de ejemplo. Son direcciones públicas de prueba con valores inventados.',
    clearExample: 'Borrar el ejemplo',
    planH: 'Tu plan Bunker',
    copy: 'Copiar plan',
    print: 'Imprimir',
    copied: 'Plan copiado.',
    copyFallback: 'Selecciona todo el texto de arriba y cópialo.',
    guideH: 'Guía de campo',
    line: 'línea',
    lines: 'líneas',
    empty: 'Pega tus direcciones arriba y elige Revisar direcciones. Tus resultados y tu plan aparecen aquí.',
    noLabel: 'Sin etiqueta',
    netQ: '¿Qué red es esta?',
    sentQ: '¿Alguna vez envió una transacción o firmó un mensaje?',
    notSure: 'No sé',
    no: 'No',
    yes: 'Sí',
    valuePh: 'Valor, opcional',
    valueAria: 'Valor en dólares estadounidenses, opcional',
    explorer: 'Abrir en el explorador',
    remove: 'Quitar',
    toDark: 'Cambiar a modo oscuro',
    toLight: 'Cambiar a modo claro',
    langGroup: 'Idioma',
    footerNav: 'Pie de página',
    planTitle: 'PLAN BUNKER',
    secretIs: 'Esto parece {what}. La página lo borró.',
    prefixHint: 'Si es una dirección, pon 0x delante para Sui, Aptos o IOTA. Para una cuenta implícita de NEAR, pon near: delante. Ese prefijo es una convención de Bunker, para que los 64 caracteres hexadecimales no se confundan con una clave.',
    neverSent: 'Esta página no lo envió a ningún lado. Las herramientas reales solo necesitan tu dirección pública. Quien te pide una frase semilla o una clave privada quiere vaciar tu billetera.',
    exampleLabels: Object.freeze(['Ordinals', 'Ahorros BTC', 'Billetera diaria', 'Staking SOL', 'DOT']),
  }),
});

/**
 * The result sentence, as parts. A part with a class gets color on the page.
 * @param {string} lang
 * @param {{ n: number, ex: number, ck: number, atRisk: string }} c atRisk is formatted money or ''
 * @returns {(string | [string, string])[]}
 */
export function verdictParts(lang, c) {
  /** @type {(string | [string, string])[]} */
  const parts = [];
  if (lang === 'es') {
    const noun = c.n === 1 ? ' dirección' : ' direcciones';
    if (c.ex) parts.push(['n-ex', c.ex + ' de ' + c.n], noun + (c.ex === 1 ? ' muestra su candado.' : ' muestran su candado.'));
    else parts.push(['n-hd', 'Ninguna dirección'], ' muestra su candado.');
    if (c.atRisk) parts.push(' ', ['n-ex', c.atRisk], ' está detrás de un candado visible.');
    if (c.ck) parts.push(' ', ['n-ck', String(c.ck)], c.ck === 1 ? ' necesita tu respuesta.' : ' necesitan tu respuesta.');
    return parts;
  }
  const noun = c.n === 1 ? ' address' : ' addresses';
  if (c.ex) parts.push(['n-ex', c.ex + ' of ' + c.n], noun + (c.ex === 1 ? ' shows its lock.' : ' show their lock.'));
  else parts.push(['n-hd', 'No address'], ' shows its lock.');
  if (c.atRisk) parts.push(' ', ['n-ex', c.atRisk], ' sits behind a visible lock.');
  if (c.ck) parts.push(' ', ['n-ck', String(c.ck)], c.ck === 1 ? ' needs your answer.' : ' need your answer.');
  return parts;
}
