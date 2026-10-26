// @ts-check
// The page state. It lives in memory only. Nothing is stored or sent (ADR-001, ADR-029).

/** @type {{ entries: import('../parse.js').Entry[], isExample: boolean, lang: 'en' | 'es' }} */
export const UI_STATE = { entries: [], isExample: false, lang: 'en' };

/** Public example addresses (test vectors and well-known addresses), with example answers. */
export const UI_EXAMPLE = Object.freeze([
  ['bc1p5cyxnuxmeuwuvkwfem96lqzszd02n6xdcjrs20cac6yqjjwudpxqkedrcr', null, 3100],
  ['bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4', 'no', 9800],
  ['0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed', 'yes', 6400],
  ['3QBBuLUJNw3TQK4Pp4dUryEPyxSxDP5CEqnQQig4RRRX', null, 2200],
  ['15oF4uVJwmo4TdGW7VfQxNLavjCXviqxT9S1MgbjMNHr6Sp5', null, 750],
]);
