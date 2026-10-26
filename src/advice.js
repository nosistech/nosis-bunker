// @ts-check
// Advice text for each plan step. Pure functions: an entry in, one or two sentences out.
import { CHAINS } from './chains.js';

/**
 * Advice for an address whose key is visible but that has a hidden alternative.
 * @param {{ chain: string | null, moveText?: string }} e
 * @returns {string}
 */
export function moveAdvice(e) {
  if (e.moveText) return e.moveText;
  switch (e.chain) {
    case 'btc': return 'Send to a new bc1q receive address from a Native SegWit account on your hardware wallet. Send a small test amount first.';
    case 'ltc': return 'Send to a new ltc1q receive address from a SegWit account on your hardware wallet. Send a small test amount first.';
    case 'liquid': return 'Send to a new Liquid receive address. Do not use it again for other payments. Send a small test amount first.';
    case 'doge': case 'bch': case 'xec': case 'dash': case 'dgb': case 'rvn': case 'zec': case 'kas':
      return 'Send to a new receive address in your wallet. Do not use it again for other payments.';
    case 'evm': return 'Add a new account on your hardware wallet. Use it only to receive. Move coins and tokens on every EVM network where this address holds them.';
    case 'aptos': case 'xrp': case 'starknet': return 'Move to a new account that has never sent, or change this account to a new key when post-quantum keys are available.';
    case 'avax': return 'Move to a new address that has never sent. For staked AVAX, plan the move for the end of the staking period.';
    default: return 'Make a new account in your wallet, move the funds there, and do not send from it.';
  }
}

/**
 * Advice for an address whose key is visible and that has no hidden alternative yet.
 * @param {{ chain: string | null, type: string }} e
 * @returns {string}
 */
export function waitAdvice(e) {
  const c = e.chain;
  if ((c === 'btc' || c === 'ltc') && /Taproot/.test(e.type)) {
    return 'Taproot has no hidden option yet. Keep inscriptions here. Move plain coins to a new SegWit address. Be ready to move to BIP-360 outputs when they activate.';
  }
  if (c === 'btc' || c === 'ltc') return 'This address type publishes keys by design. Keep long-term savings on a new bc1q address.';
  if (c === 'spark' || c === 'ark') return 'This layer has no hidden address type. Keep spending money here and savings on a new bc1q address on Bitcoin. You can withdraw to Bitcoin at any time.';
  if (c === 'lightning') return 'Lightning keys are public by design. Keep only spending balances in channels. Keep savings on a new bc1q address.';
  if (c === 'sol') return 'A Solana address is its key, so a new address does not hide it. For long-term SOL, the hash-based Winternitz Vault is an option for advanced users. Follow the Solana post-quantum upgrade.';
  if (c === 'kas') return 'Standard Kaspa addresses show the key. Follow the Kaspa post-quantum plans. Do not keep more than you need on one address.';
  if (c === 'xmr') return 'No Monero address hides its keys. Follow the Monero post-quantum research and move when an upgrade is available.';
  if (c === 'nostr') return 'This is an identity key, not a wallet. Do not use the same key to hold funds.';
  if (c && CHAINS[c] && CHAINS[c].rotate) return 'This network can change the key behind an account without moving funds. Change to a post-quantum key when the network supports one.';
  return 'No address type hides the key on this network yet. Follow its post-quantum upgrade and move when it is available.';
}

/**
 * Advice for an address whose key is still hidden.
 * @param {{ chain: string | null }} e
 * @returns {string}
 */
export function keepAdvice(e) {
  const c = e.chain;
  if (c && CHAINS[c] && CHAINS[c].family === 'account') {
    return 'Use it as a vault that only receives. When you need the funds, move all of them to a new vault in one step.';
  }
  return 'Use it only to receive. When you spend, your wallet sends the change to a new address, and the rest stays hidden.';
}
