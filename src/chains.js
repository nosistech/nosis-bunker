// @ts-check
// Network registry: display name, explorer link template, account style, key rotation.
// Explorer templates are set only after the format was checked against live explorer pages.
// See docs/decisions/ADR-014-explorer-links.md. {a} is replaced with the encoded address.

/**
 * @typedef {Object} Chain
 * @property {string} name
 * @property {string} [explorer]
 * @property {'utxo' | 'account'} family  utxo: change goes to new addresses; account: one address holds everything
 * @property {boolean} [rotate]           the network can change the key behind an account without moving funds
 */

/** @type {Readonly<Record<string, Chain>>} */
export const CHAINS = Object.freeze({
  btc: { name: 'Bitcoin', explorer: 'https://mempool.space/address/{a}', family: 'utxo' },
  lightning: { name: 'Lightning', explorer: 'https://amboss.space/node/{a}', family: 'account' },
  liquid: { name: 'Liquid', explorer: 'https://blockstream.info/liquid/address/{a}', family: 'utxo' },
  spark: { name: 'Spark (Bitcoin L2)', family: 'account' },
  ark: { name: 'Ark (Bitcoin L2)', family: 'account' },
  stx: { name: 'Stacks', explorer: 'https://explorer.hiro.so/address/{a}?chain=mainnet', family: 'account' },
  ltc: { name: 'Litecoin', explorer: 'https://litecoinspace.org/address/{a}', family: 'utxo' },
  doge: { name: 'Dogecoin', explorer: 'https://blockchair.com/dogecoin/address/{a}', family: 'utxo' },
  bch: { name: 'Bitcoin Cash', explorer: 'https://blockchair.com/bitcoin-cash/address/{a}', family: 'utxo' },
  xec: { name: 'eCash', explorer: 'https://explorer.e.cash/address/{a}', family: 'utxo' },
  dash: { name: 'Dash', explorer: 'https://blockchair.com/dash/address/{a}', family: 'utxo' },
  dgb: { name: 'DigiByte', family: 'utxo' },
  rvn: { name: 'Ravencoin', family: 'utxo' },
  kas: { name: 'Kaspa', explorer: 'https://explorer.kaspa.org/addresses/{a}', family: 'utxo' },
  xmr: { name: 'Monero', family: 'utxo' },
  zec: { name: 'Zcash', explorer: 'https://blockchair.com/zcash/address/{a}', family: 'utxo' },
  evm: { name: 'EVM networks', explorer: 'https://blockscan.com/address/{a}', family: 'account' },
  sui: { name: 'Sui', explorer: 'https://suiscan.xyz/mainnet/account/{a}', family: 'account' },
  aptos: { name: 'Aptos', explorer: 'https://explorer.aptoslabs.com/account/{a}?network=mainnet', family: 'account', rotate: true },
  iota: { name: 'IOTA', explorer: 'https://explorer.iota.org/address/{a}', family: 'account' },
  starknet: { name: 'Starknet', explorer: 'https://voyager.online/contract/{a}', family: 'account', rotate: true },
  xrp: { name: 'XRP Ledger', explorer: 'https://livenet.xrpl.org/accounts/{a}', family: 'account', rotate: true },
  xlm: { name: 'Stellar', explorer: 'https://stellar.expert/explorer/public/account/{a}', family: 'account', rotate: true },
  hbar: { name: 'Hedera', explorer: 'https://hashscan.io/mainnet/account/{a}', family: 'account', rotate: true },
  algo: { name: 'Algorand', explorer: 'https://allo.info/account/{a}', family: 'account', rotate: true },
  canton: { name: 'Canton Network', family: 'account' },
  tron: { name: 'Tron', explorer: 'https://tronscan.org/#/address/{a}', family: 'account' },
  ada: { name: 'Cardano', explorer: 'https://cardanoscan.io/address/{a}', family: 'utxo' },
  sol: { name: 'Solana', explorer: 'https://solscan.io/account/{a}', family: 'account' },
  ton: { name: 'TON', explorer: 'https://tonviewer.com/{a}', family: 'account' },
  near: { name: 'NEAR', explorer: 'https://nearblocks.io/address/{a}', family: 'account', rotate: true },
  xtz: { name: 'Tezos', explorer: 'https://tzkt.io/{a}', family: 'account' },
  fil: { name: 'Filecoin', explorer: 'https://filfox.info/en/address/{a}', family: 'account' },
  flow: { name: 'Flow', explorer: 'https://www.flowscan.io/account/{a}', family: 'account', rotate: true },
  egld: { name: 'MultiversX', explorer: 'https://explorer.multiversx.com/accounts/{a}', family: 'account' },
  mina: { name: 'Mina', explorer: 'https://minascan.io/mainnet/account/{a}', family: 'account' },
  icp: { name: 'Internet Computer', family: 'account' },
  avax: { name: 'Avalanche X/P-Chain', family: 'utxo' },
  neo: { name: 'Neo N3', family: 'account' },
  cosmos: { name: 'Cosmos SDK', family: 'account' },
  substrate: { name: 'Substrate', family: 'account' },
  hashacct: { name: 'Account', family: 'account' },
  nostr: { name: 'Nostr', explorer: 'https://njump.me/{a}', family: 'account' },
});

export const EVM_NETWORKS = 'Ethereum, Base, Arbitrum, Optimism, Polygon, BNB Chain, Avalanche C-Chain, Sonic, Linea, zkSync, Scroll, Mantle, Gnosis, Celo, Cronos, Berachain, Monad, HyperEVM, Plasma, Plume, Rootstock, BOB, Core, VeChain, XDC, Ronin and Harmony';

export const EVM_TOKENS = 'Tokens held there are covered by the same check, including USDT, USDC, PAXG, XAUT, QNT, ONDO and tokenized funds such as BUIDL.';
