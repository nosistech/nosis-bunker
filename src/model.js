// @ts-check
// The exposure model. Every detector returns a Verdict built with verdict().
// See docs/decisions/ADR-007-exposure-model.md.

/** How a network exposes the public key ("the lock"). */
export const MODEL = Object.freeze({
  HIDDEN_UNTIL_USED: 'hidden-until-used', // the key appears on chain the first time the address sends or signs
  VISIBLE: 'visible',                     // the key is visible from day one
  HASH_SAFE: 'hash-safe',                 // no curve key to recover (for example BIP-360 outputs)
  ASK_PROVIDER: 'ask-provider',           // permissioned network, or the answer is outside the address
  MOVE_POOL: 'move-pool',                 // the pool is at risk and a safer pool exists (Zcash Sapling)
  XPUB: 'xpub',                           // extended public key: shows every key in a wallet
  UNKNOWN: 'unknown',                     // not recognized, test network, typo, or not a wallet
});

/** What the user sees on the card. */
export const STATUS = Object.freeze({
  EXPOSED: 'exposed',
  HIDDEN: 'hidden',
  CHECK: 'check',
  PROTECTED: 'protected',
  WARNING: 'warning',
  UNKNOWN: 'unknown',
});

export const TEXT = Object.freeze({
  TESTNET: 'Test network coins have no value. Nothing to protect here.',
  HASH_HIDDEN: 'The address is a hash of the key. The key stays hidden until the account sends.',
  SEGWIT_HIDDEN: 'Only a hash of the key is on chain until this address spends.',
  SCRIPT_HIDDEN: 'The signer keys appear on chain the first time this address spends.',
});

/**
 * @typedef {Object} Verdict
 * @property {string | null} chain   key into CHAINS, or null
 * @property {string} type           short label, for example "Taproot (bc1p)"
 * @property {string} model          one of MODEL
 * @property {string} why            one or two sentences for the user
 * @property {string} [explorer]     explorer URL template with {a}, or null for no link
 * @property {boolean} [noLink]      true when no explorer link must show
 * @property {string} [chainLabel]   network name when it differs from CHAINS[chain].name
 * @property {string[]} [options]    networks the user can pick from when the format is shared
 * @property {string} [networks]     networks that share the same key (EVM)
 * @property {string} [tokens]       note about tokens covered by the same key
 * @property {string} [address]      normalized address, when it differs from the input
 * @property {string} [askText]      plan text for ASK_PROVIDER entries
 * @property {string} [moveText]     plan text for MOVE_POOL entries
 * @property {string} [pill]         card label override
 */

/**
 * Build a frozen verdict.
 * @param {string | null} chain
 * @param {string} type
 * @param {string} model
 * @param {string} why
 * @param {Partial<Verdict>} [extra]
 * @returns {Verdict}
 */
export function verdict(chain, type, model, why, extra = {}) {
  return Object.freeze(Object.assign({ chain, type, model, why }, extra));
}

/**
 * Verdict for a format that looks right but fails its checksum.
 * @param {string} what for example "a Kaspa address"
 * @returns {Verdict}
 */
export function checksumFailed(what) {
  return verdict(null, 'Checksum failed', MODEL.UNKNOWN, 'This looks like ' + what + ', but the checksum is wrong. Look for a typo.');
}

/**
 * Turn a model plus the user's answer into the card status.
 * @param {{ model: string, sent?: string }} entry sent is 'yes', 'no' or 'unsure'
 * @returns {string} one of STATUS
 */
export function statusOf(entry) {
  switch (entry.model) {
    case MODEL.VISIBLE: return STATUS.EXPOSED;
    case MODEL.MOVE_POOL: return STATUS.EXPOSED;
    case MODEL.HASH_SAFE: return STATUS.PROTECTED;
    case MODEL.XPUB: return STATUS.WARNING;
    case MODEL.ASK_PROVIDER: return STATUS.CHECK;
    case MODEL.HIDDEN_UNTIL_USED:
      if (entry.sent === 'yes') return STATUS.EXPOSED;
      if (entry.sent === 'no') return STATUS.HIDDEN;
      return STATUS.CHECK;
    default: return STATUS.UNKNOWN;
  }
}
