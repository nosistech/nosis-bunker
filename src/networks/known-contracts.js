// @ts-check
// Well-known token contracts. People often paste these by mistake instead of their own wallet.
// A contract has no key to protect, so we tell the user to paste their own address.
// See docs/decisions/ADR-022-token-contracts.md for why the list is short and curated.
import { verdict, MODEL } from '../model.js';

/** Keys: lowercase for 0x addresses, exact case for other formats. */
const KNOWN_CONTRACTS = Object.freeze({
  '0x4a220e6096b25eadb88358cb44068a3248254675': ['evm', 'QNT (Quant)'],
  '0xdac17f958d2ee523a2206206994597c13d831ec7': ['evm', 'USDT (Tether)'],
  '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48': ['evm', 'USDC (Circle)'],
  '0x45804880de22913dafe09f4980848ece6ecbaf78': ['evm', 'PAXG (Paxos Gold)'],
  '0x68749665ff8d2d112fa859aa293f07a622782f38': ['evm', 'XAUT (Tether Gold)'],
  '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599': ['evm', 'WBTC (Wrapped Bitcoin)'],
  'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t': ['tron', 'USDT on Tron'],
  'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v': ['sol', 'USDC on Solana'],
  'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB': ['sol', 'USDT on Solana'],
});

/** Program addresses that explorers show next to every transaction. They are code, not wallets. */
const KNOWN_PROGRAMS = Object.freeze({
  '11111111111111111111111111111111': ['sol', 'Solana System Program'],
  'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA': ['sol', 'Solana Token Program'],
});

/**
 * @param {string} a trimmed address
 * @returns {import('../model.js').Verdict | null}
 */
export function detectKnownContract(a) {
  const key = /^0x/i.test(a) ? a.toLowerCase() : a;
  const hit = Object.prototype.hasOwnProperty.call(KNOWN_CONTRACTS, key) ? KNOWN_CONTRACTS[key] : null;
  if (hit) {
    return verdict(hit[0], 'Token contract: ' + hit[1], MODEL.UNKNOWN,
      'This is the token contract, not a wallet. It has no key to protect. Paste your own address that holds this token.');
  }
  const prog = Object.prototype.hasOwnProperty.call(KNOWN_PROGRAMS, key) ? KNOWN_PROGRAMS[key] : null;
  if (!prog) return null;
  return verdict(prog[0], 'Program: ' + prog[1], MODEL.UNKNOWN,
    'This is a program, not a wallet. It has no key to protect. Paste your own address.');
}
