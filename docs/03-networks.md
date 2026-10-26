# 03. Networks

This document lists every network that Bunker knows. For each network, it gives the address format, the rule for the lock, the checksum, and the explorer link status.

## How to read the tables

- **Lock rule.** `hidden` means "hidden until the address sends or signs". `visible` means "visible from day one".
- **Checksum.** The algorithm that finds typos. "None" means the format has no checksum, so the tool can only examine the shape.
- **Link.** "Yes" means the explorer link format was checked against live explorer pages. "No" means no link shows. See [ADR-014](decisions/ADR-014-explorer-links.md).

## Bitcoin and its layers

| Network | Format and example | Lock rule | Checksum | Link |
|---|---|---|---|---|
| Bitcoin legacy | `1...` (`1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa`, the genesis address) | hidden | Base58Check (double SHA-256) | Yes |
| Bitcoin nested SegWit or script | `3...` | hidden | Base58Check | Yes |
| Bitcoin native SegWit | `bc1q...` (`bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4`) | hidden | Bech32 | Yes |
| Bitcoin Taproot | `bc1p...` | **visible**: the key is in the address | Bech32m | Yes |
| Bitcoin BIP-360 (P2MR) | `bc1z...` (future) | hash-safe | Bech32m | Yes |
| Silent Payments (BIP-352) | `sp1q...` | **visible**: scan and spend keys are in the address | Bech32m | No (never on chain) |
| Lightning node ID | `02...` or `03...` (66 hex) | **visible**: node keys are public | None (it is a key) | Yes |
| Lightning invoice | `lnbc...` | **visible**: carries the node key | Bech32 (long form) | No |
| Lightning offer | `lno1...` | **visible** | None | No |
| Liquid | `ex1q...` | hidden | Bech32 | Yes |
| Liquid confidential | `lq1...` | hidden (Taproot form: visible) | Blech32 (12-character checksum) | Yes |
| Spark | `spark1...` | **visible**: carries the identity key | Bech32m | No |
| Ark | `ark1...` | **visible**: carries public keys | Bech32m | No |
| Stacks | `SP...`, `SM...` | hidden | c32check (double SHA-256) | Yes |

**Example.** An Xverse wallet shows five addresses: `3...` (payment), `bc1p...` (Ordinals), `SP...` (Stacks), `0x...` (Starknet) and `spark1...` (Spark). Bunker gives: hidden, visible, hidden, hidden, visible.

## Ethereum and EVM networks

One key gives one `0x` address on every EVM network. If you send on one network, the key is public on all of them.

| Network | Format | Lock rule | Checksum | Link |
|---|---|---|---|---|
| Ethereum, Base, Arbitrum, Optimism, Polygon, BNB Chain, Avalanche C-Chain, Sonic, Linea, zkSync, Scroll, Mantle, Gnosis, Celo, Cronos, Berachain, Monad, HyperEVM, Plasma, Plume, Rootstock, BOB, Core, VeChain | `0x` + 40 hex | hidden | EIP-55 (mixed case, Keccak-256) | Yes (Blockscan) |
| Ronin | `ronin:` + 40 hex | hidden | None | Yes |
| XDC | `xdc` + 40 hex | hidden | None | Yes |
| Harmony | `one1...` | hidden | Bech32 | Yes |
| Filecoin EVM | `f410f...` | hidden | None in this tool | No |

**Tokens.** USDT, USDC, PAXG, XAUT, QNT, ONDO and tokenized funds such as BUIDL use the key of the wallet that holds them. Paste your wallet address, not the token contract. The tool knows the main contracts and tells you if you paste one by mistake.

**About QNT.** QNT is a token on Ethereum. Quant Network runs Overledger (software that connects ledgers) and Quant Fusion (a permissioned rollup for institutions, live since June 2, 2026). Retail users hold QNT on Ethereum addresses.

## Institutions, payments and tokenized assets

| Network | Format | Lock rule | Checksum | Link |
|---|---|---|---|---|
| XRP Ledger | `r...` | hidden | Base58Check with the Ripple alphabet | Yes |
| Stellar | `G...` (56 characters) | **visible** | CRC-16/XMODEM | Yes |
| Stellar muxed | `M...` (69 characters) | **visible** | CRC-16/XMODEM | Yes |
| Hedera | `0.0.12345` | **visible**: keys are on the ledger; keys can change | Optional, not verified | Yes |
| Algorand | 58 uppercase characters | **visible**; rekeying can change the key | SHA-512/256 | Yes |
| Canton Network | `name::1220` + 64 hex | ask your provider | None | No |
| Polymesh (regulated securities) | SS58 prefix 12 | **visible** | BLAKE2b (SS58) | Yes |
| Centrifuge (real-world assets) | SS58 prefix 36 | **visible** | BLAKE2b (SS58) | Yes |
| Provenance (Figure) | `pb1...` | hidden | Bech32 | No |
| MANTRA | `mantra1...` | hidden | Bech32 | No |
| Avalanche X-Chain | `X-avax1...` | hidden | Bech32 | No |
| Avalanche P-Chain (staking) | `P-avax1...` | hidden | Bech32 | Yes |
| Tron | `T...` | hidden | Base58Check | Yes |

**Why Canton gets no rating.** Canton is permissioned. The party ID is a hash, but the key is shared with the nodes on its synchronizer. The plan lists the questions to ask the operator. See [ADR-012](decisions/ADR-012-permissioned-networks.md).

## Smart contract platforms

| Network | Format | Lock rule | Checksum | Link |
|---|---|---|---|---|
| Solana | Base58, 32 bytes | **visible**: the address is the key | None | Yes |
| Cardano | `addr1...`, `stake1...` | hidden | Bech32 | Yes |
| Sui, Aptos, IOTA | `0x` + 64 hex (you pick the network) | hidden | None | Yes |
| Starknet | `0x` + up to 64 hex | hidden; keys can change | None | Yes |
| TON | `EQ...`, `UQ...` (48 characters) | hidden | CRC-16/XMODEM | Yes |
| NEAR | `name.near` or `near:` + 64 hex (the `near:` prefix is a Bunker convention: bare 64 hex is treated as a possible key) | **visible** | None | Yes |
| Tezos | `tz1...` to `tz4...` | hidden (revealed by the "reveal" operation) | Base58Check | Yes |
| Flow | `0x` + 16 hex | **visible**; keys can change | Not verified | Yes |
| MultiversX | `erd1...` | **visible** | Bech32 | Yes |
| Mina | `B62...` | **visible** | Base58Check | Yes |
| Internet Computer | 64-hex account ID, or `xxxxx-...-cai` principal | hidden | CRC-32 | Yes (accounts) |
| Neo N3 | `N...` | hidden | Base58Check | No |
| Radix, Nervos, Oasis, Zilliqa | Bech32 prefixes | hidden | Bech32 | No |
| Polkadot, Kusama, Astar, Acala, Bifrost, Hydration, KILT | SS58 | **visible** | BLAKE2b (SS58) | Yes |

## Cosmos networks

All Cosmos SDK networks use a Bech32 hash of the key with a network prefix. The key goes on chain after the first transaction. The lock rule is **hidden** for all of them.

The tool knows 45 prefixes: Cosmos Hub, Osmosis, Celestia, dYdX, Akash, Juno, Stargaze, Injective, Sei, Kava, Axelar, Stride, Neutron, Noble, Secret, Persistence, Babylon, THORChain, Maya, Kujira, Evmos, Terra, Provenance, MANTRA, Cronos POS, Dymension, ZetaChain, Saga, Fetch.ai, Sentinel, Regen, Archway, Nibiru, Sommelier, UX (Umee), Quicksilver, Lava, Elys, Initia, XPLA, Band, KYVE, Agoric, OmniFlix and BitSong.

Explorer links use Mintscan's `/account/` path where Mintscan supports the network. THORChain uses RUNEScan. Maya uses MayaScan.

## Store of value and payments

| Network | Format | Lock rule | Checksum | Link |
|---|---|---|---|---|
| Litecoin | `L...`, `M...`, `ltc1q...`, `ltc1p...` | hidden (Taproot: visible) | Base58Check, Bech32 | Yes |
| Litecoin MWEB | `ltcmweb1...` | **visible**: scan and spend keys | Bech32 | No |
| Dogecoin | `D...` | hidden | Base58Check | Yes |
| Bitcoin Cash | `bitcoincash:q...` or `q...` | hidden | CashAddr (40-bit) | Yes |
| eCash | `ecash:q...` | hidden | CashAddr | Yes |
| Kaspa | `kaspa:q...` | **visible**: the address is the key | CashAddr | Yes |
| Kaspa script | `kaspa:p...` | hidden | CashAddr | Yes |
| Dash | `X...`, `7...` | hidden | Base58Check | Yes |
| DigiByte | `dgb1q...` (legacy `D...` looks like Dogecoin) | hidden | Bech32, Base58Check | No |
| Ravencoin | `R...` | hidden | Base58Check | No |

## Privacy, AI and identity

| Network | Format | Lock rule | Checksum | Link |
|---|---|---|---|---|
| Monero | `4...`, `8...` (95 or 106 characters) | **visible**: the address has the spend and view keys | Keccak-256 (Monero Base58) | No (private by design) |
| Zcash transparent | `t1...`, `t3...`, `tex1...` | hidden | Base58Check, Bech32m | Yes |
| Zcash Sapling | `zs1...` | **move to Ironwood**: Sapling has no recovery path | Bech32 | No |
| Zcash unified | `u1...` | check your pool | Bech32m | No |
| Bittensor | SS58 prefix 42 (`5...`) | **visible** | BLAKE2b (SS58) | Yes (Taostats) |
| Fetch.ai | `fetch1...` | hidden | Bech32 | No |
| Filecoin | `f1...` hidden, `f3...` **visible** (BLS key) | see left | BLAKE2b-32 | Yes |
| Nostr | `npub1...` | **visible**: it is a public key | Bech32 | Yes |

## Inputs that are not wallets

| Input | Result |
|---|---|
| Extended public key (`xpub`, `ypub`, `zpub`) | Shows every key: stop sharing it. |
| Names (`example.eth`) | Not rated: paste the address behind the name. |
| Lightning address (`name@domain`) | Not rated: it points to a server. |
| Token contracts (QNT, USDT, USDC, PAXG, XAUT, WBTC) | Not rated: paste your own wallet address. |
| Test network addresses | Not rated: test coins have no value. |

## Known limits

- **Hedera** optional checksums (`0.0.123-abcde`) are accepted but not verified.
- **Flow** addresses have an error-detection code that the tool does not verify yet.
- **Ronin and XDC** in lowercase hex carry no checksum by design.
- **Private bank networks** (for example Kinexys and Partior) have no public addresses. No scanner can examine them. A review of the provider is necessary.
