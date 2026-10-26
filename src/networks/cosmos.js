// @ts-check
// Cosmos SDK networks share one address format: a Bech32 hash of the key with a network prefix.
// Explorer links use Mintscan's /account/ path, checked against live pages. See P-08.
import { verdict, MODEL } from '../model.js';

const mintscan = slug => 'https://www.mintscan.io/' + slug + '/account/{a}';

/** prefix: [network name, explorer template or null] */
export const COSMOS_PREFIXES = Object.freeze({
  cosmos: ['Cosmos Hub', mintscan('cosmos')], osmo: ['Osmosis', mintscan('osmosis')], celestia: ['Celestia', mintscan('celestia')],
  dydx: ['dYdX', mintscan('dydx')], akash: ['Akash', mintscan('akash')], juno: ['Juno', mintscan('juno')], stars: ['Stargaze', mintscan('stargaze')],
  inj: ['Injective', mintscan('injective')], sei: ['Sei', mintscan('sei')], kava: ['Kava', mintscan('kava')], axelar: ['Axelar', mintscan('axelar')],
  stride: ['Stride', mintscan('stride')], neutron: ['Neutron', mintscan('neutron')], noble: ['Noble', mintscan('noble')],
  secret: ['Secret Network', mintscan('secret')], persistence: ['Persistence', mintscan('persistence')], bbn: ['Babylon', mintscan('babylon')],
  thor: ['THORChain', 'https://runescan.io/address/{a}'], maya: ['Maya Protocol', 'https://www.mayascan.org/address/{a}'],
  kujira: ['Kujira', null], evmos: ['Evmos', null], terra: ['Terra', null], pb: ['Provenance (Figure)', null], mantra: ['MANTRA', null],
  cro: ['Cronos POS (Crypto.com)', null], dym: ['Dymension', null], zeta: ['ZetaChain', null], saga: ['Saga', null],
  fetch: ['Fetch.ai (ASI)', null], sent: ['Sentinel', null], regen: ['Regen', null], archway: ['Archway', null], nibi: ['Nibiru', null],
  somm: ['Sommelier', null], umee: ['UX (Umee)', null], quick: ['Quicksilver', null], lava: ['Lava', null], elys: ['Elys', null],
  init: ['Initia', null], xpla: ['XPLA', null], band: ['Band Protocol', null], kyve: ['KYVE', null], agoric: ['Agoric', null],
  omniflix: ['OmniFlix', null], bitsong: ['BitSong', null],
});

/**
 * @param {string} hrp
 * @returns {import('../model.js').Verdict | null}
 */
export function cosmosVerdict(hrp) {
  if (!Object.prototype.hasOwnProperty.call(COSMOS_PREFIXES, hrp)) return null;
  const [name, explorer] = COSMOS_PREFIXES[hrp];
  return verdict('cosmos', name + ' account', MODEL.HIDDEN_UNTIL_USED,
    'The address is a hash of the key. The network stores the key on chain after the first transaction.',
    { chainLabel: name, explorer });
}

/** Number of Cosmos prefixes, for the documentation and tests. */
export const COSMOS_PREFIX_COUNT = Object.keys(COSMOS_PREFIXES).length;
