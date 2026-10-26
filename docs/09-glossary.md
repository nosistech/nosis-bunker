# 09. Glossary

Each word has one meaning in this project.

| Word | Meaning |
|---|---|
| Address | The text that you give to other people so that they can send you coins. |
| Ask provider | A model for networks where the answer is not in the address, for example Canton. |
| Base58, Base58Check | A text encoding without the characters 0, O, I and l. Base58Check adds a 4-byte checksum. |
| Bech32, Bech32m | A text encoding with a prefix, the character `1`, data, and a 6-character checksum. |
| BIP | Bitcoin Improvement Proposal. A written design for a change to Bitcoin. |
| BIP-360 (P2MR) | A proposed Bitcoin address type (`bc1z`) that shows no curve key. It is on test networks only. |
| Blech32 | The Liquid version of Bech32, with a 12-character checksum. |
| Checksum | Extra characters that let software find a typo. |
| Content Security Policy (CSP) | A browser rule set that tells the browser which code and connections to allow. |
| Detector | A small function that recognizes one family of address formats. |
| Drainer | A scam website, app or email that empties a wallet. |
| ECDSA | The signature system of Bitcoin (before Taproot), Ethereum and many other networks. |
| EIP-55 | The Ethereum rule that puts a checksum in the capital letters of an address. |
| EVM | Ethereum Virtual Machine. All EVM networks use the same address format. |
| Explorer | A website that shows the transactions of an address. |
| Fresh address | An address that has received coins but has never sent or signed anything. |
| Hash | A one-way fingerprint of data. Nobody can rebuild the data from the hash. |
| Hidden until used | A model: the key appears on chain the first time the address sends or signs. |
| Lock | In this project: the public key. |
| Model | How a network exposes the key. See `src/model.js`. |
| Permissioned network | A network that only approved parties can join, for example Canton. |
| Private key | The secret that moves your coins. Never share it. |
| Public key | The lock. Anyone can use it to check your signature. |
| Seed phrase | 12 or 24 words that make all your private keys. Never share it. |
| SS58 | The address format of Polkadot and other Substrate networks. |
| Status | What the card shows: Lock visible, Check needed, Lock hidden, and others. |
| Taproot | A Bitcoin address type (`bc1p`) from 2021. It puts the public key in the address. |
| Trusted Types | A browser feature that blocks unsafe HTML strings. |
| Verdict | The result object that a detector returns. |
| Visible | A model: the key is visible from day one. |
| xpub | Extended public key. It shows the public key of every address in a wallet. |
| XSS | Cross-site scripting: an attack that runs code in your page through text. |
