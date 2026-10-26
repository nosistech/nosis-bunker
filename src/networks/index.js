// @ts-check
// The detector pipeline. classify() calls each detector in this order and stops at the first answer.
// The order is part of the design. Read the reason next to each line before you move a detector.
// See docs/04-architecture.md and docs/decisions/ADR-006-detector-pipeline.md.
import { detectKnownContract } from './known-contracts.js';
import { detectIdentifier } from './identifiers.js';
import { detectEvm } from './evm.js';
import { detectMoveOrStarknet } from './move.js';
import { detectLightning } from './lightning.js';
import { detectTextAccount } from './text-accounts.js';
import { detectCanton } from './canton.js';
import { detectStacks } from './stacks.js';
import { detectIcp } from './icp.js';
import { detectCashAddr } from './cashaddr-family.js';
import { detectFilecoin } from './filecoin.js';
import { detectLiquidConfidential } from './liquid.js';
import { detectBech32 } from './bech32-family.js';
import { detectAvalancheChainPrefixed } from './avalanche.js';
import { detectMonero } from './monero.js';
import { detectSubstrate } from './substrate.js';
import { detectBase58 } from './base58-family.js';

/** @type {ReadonlyArray<{ name: string, detect: (a: string) => (import('../model.js').Verdict | null) }>} */
export const DETECTORS = Object.freeze([
  { name: 'known-contracts', detect: detectKnownContract },   // first: a token contract can look like any wallet address
  { name: 'identifiers', detect: detectIdentifier },          // xpubs, names and handles are not addresses
  { name: 'evm', detect: detectEvm },                         // 0x + 40 hex, with EIP-55 checksum
  { name: 'move-starknet', detect: detectMoveOrStarknet },    // other 0x lengths
  { name: 'lightning', detect: detectLightning },             // before Bech32: invoices also decode as Bech32
  { name: 'text-accounts', detect: detectTextAccount },       // NEAR, Hedera, Stellar, Algorand, TON, XRP
  { name: 'canton', detect: detectCanton },                   // party IDs contain "::"
  { name: 'stacks', detect: detectStacks },                   // before Base58: SP... uses its own c32 alphabet
  { name: 'icp', detect: detectIcp },                         // 64-hex account IDs and dashed principals
  { name: 'cashaddr', detect: detectCashAddr },               // Bitcoin Cash, eCash, Kaspa
  { name: 'filecoin', detect: detectFilecoin },               // f0 to f4
  { name: 'liquid', detect: detectLiquidConfidential },       // before Bech32: lq1 uses Blech32
  { name: 'bech32', detect: detectBech32 },                   // Bitcoin SegWit, Cosmos, Cardano, Zcash and more
  { name: 'avalanche', detect: detectAvalancheChainPrefixed },// X-avax1 / P-avax1
  { name: 'monero', detect: detectMonero },                   // before Base58: Monero uses its own block encoding
  { name: 'substrate', detect: detectSubstrate },             // before generic Base58: SS58 has a BLAKE2b checksum
  { name: 'base58', detect: detectBase58 },                   // last: the most general format
]);
