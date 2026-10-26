# 01. Background

This document tells why Bunker exists. It uses simple examples.

## Why I built this

I see AI advancing at an alarming rate. AI models now solve math problems that stayed open for decades. The signatures that protect most crypto wallets depend on math problems that nobody has solved yet. Nobody has broken them today. But I do not want to wait for the day that someone does.

Crypto needs extra security now, before it is necessary. The first step is simple and costs nothing: keep your funds on addresses whose public key the world has never seen.

Carlos A. Paredes Vargas, founder of NosisTech

## What can go wrong

Most wallets use elliptic-curve signatures (for example ECDSA in Bitcoin and Ethereum). Their safety depends on one fact: nobody knows a fast way to find a private key from a public key.

History shows that this kind of fact can change. The early lock of the internet, RSA, had to grow to signatures of about 400 bytes because mathematicians kept finding shortcuts. A wallet signature is 64 bytes, because nobody has found a shortcut for its math yet.

If AI finds such a shortcut, every public key on a blockchain becomes a target. Even the new "quantum-safe" math called lattices has structure that an attacker can study. Hash functions are different: they are designed to have no structure.

## The idea in one picture: a sealed box

Think of your address as a sealed box. Your lock (the public key) is inside the box. The world sees only a fingerprint of the box (a hash).

```text
seed phrase  ->  private key  ->  public key  ->  hash  ->  address
(your 24 words)   (the key)       (the lock)      (fingerprint)
```

Each arrow goes in one direction only. The feared attack goes backward from the lock to the key.

- When you **receive** coins, the box stays closed.
- When you **sign** anything, the box opens. The lock becomes public. A transaction, a token approval, an NFT listing and a "sign in with wallet" message all open the box.
- Nobody can pick a lock that nobody can see.

## Three examples

**Example 1: Bitcoin savings.** You receive 0.5 BTC on a new `bc1q...` address. You never send from it. The lock is hidden. The result is **Lock hidden**.

**Example 2: an Ethereum wallet for daily use.** You use `0x5a...` every week to swap tokens. The lock became public the first time you sent. The result is **Lock visible**. The fix: make a new account on your hardware wallet, and use it only to receive.

**Example 3: Ordinals on Taproot.** Your inscriptions are on `bc1p...`. A Taproot address puts the lock in the address itself. A new Taproot address does not help. The fix must wait for BIP-360. Until then, keep plain bitcoin off this address.

## Who gets attacked first

An early break would be slow and expensive for each key. An attacker would start with the largest open boxes. Thousands of early Bitcoin addresses hold 50 BTC each, and their locks are public. They give smaller holders time. They do not give protection forever.

## Move slowly

A rushed migration can lose more money than the risk that it avoids. Wrong addresses, fake tools and lost keys are real dangers today. Do only the easy steps first, and send a small test amount before each large move.

## Where things stand on October 25, 2026

- Nobody has shown a break of ECDSA or of the Solana signature system.
- Security experts disagree on how soon a break can come. They agree that a rushed migration is dangerous.
- Fake emails that look like Ledger and Trezor now push a "quantum patch". They are scams.
- Bitcoin BIP-360 (a new address type with no visible key) is on test networks only.
- Zcash opened a new shielded pool, Ironwood, that supports quantum-recoverable notes. Sapling and Orchard funds must be moved there.

## What Bunker does about it

Bunker answers one question for each address: is the lock visible, hidden, or unknown? Then it makes a plan in a fixed order:

1. Ground rules (do not hurry, never type a seed phrase, send a test amount first).
2. Move funds that you can hide.
3. List funds that you cannot hide yet, with what to watch.
4. Questions to check or to ask.
5. Addresses to keep hidden.
6. The real fixes to watch for.
