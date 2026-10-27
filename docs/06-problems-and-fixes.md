# 06. Problems and fixes

This document lists each problem that we found during the build. For each problem, it gives an example, the options, the fix, the reason, and the test that now prevents the problem.

## Summary

| ID | Problem | Fix |
|---|---|---|
| P-01 | Stacks addresses were not recognized | c32check decoder |
| P-02 | Starknet and Spark were missing | Two new detectors |
| P-03 | Spark and Silent Payments shared the `sp` prefix | Decide by the first data character |
| P-04 | The guard blocked valid ICP account IDs | Check the CRC-32 first |
| P-05 | The guard almost blocked Sui and Aptos addresses | Block only bare 64 hex |
| P-06 | Liquid confidential checksums were not verified | Blech32 from the reference constants |
| P-07 | Zcash shielded addresses had no rating | Rate by pool, from Zcash research |
| P-08 | Cosmos explorer links were wrong | Mintscan `/account/` path |
| P-09 | Two explorer links were not verified | Remove them |
| P-10 | Filecoin `f4` addresses were not recognized | Separate rule for `f410f` |
| P-11 | Long formats failed the length limit | Length limit for each format |
| P-12 | Web fonts made third-party requests | System fonts |
| P-13 | Ethereum typos were accepted | EIP-55 checksum |
| P-14 | People pasted token contracts | List of known contracts |
| P-15 | Short Stacks addresses were rejected | Shorter minimum length |
| P-16 | Bittensor addresses showed as Polkadot | Read the SS58 prefix |
| P-17 | Random Base58 text showed as Polkadot | Verify the SS58 checksum |
| P-18 | The prototype built HTML strings | DOM methods and `textContent` |
| P-19 | XRP, Stellar, Algorand and TON had no checksum check | Four checksum validators |
| P-20 | Base32 accepted two spellings of one address | Canonical form only |
| P-21 | The build rejected type notes in comments | Ignore comments in that rule |
| P-22 | The docs had long sentences and mixed words | Strict house writing rules |
| P-23 | The tools allowed Node.js versions with known flaws | Version gate and pinned Node.js in CI |
| P-24 | The link check could decompress data from any server | Read only the status code with `node:https` |
| P-25 | Keyboard focus was lost after an answer | Put focus back on the same button |
| P-26 | A host can change the HTML and break the CSP hashes | `no-transform` header and a host checklist |
| P-27 | The font had no Spanish letters | Subset again with Latin-1 |
| P-28 | A translation pattern matched across two sentences | Patterns cannot cross a period |
| P-29 | Field borders and one link were below WCAG minimums | 3:1 border color; 24-pixel targets |
| P-30 | A hidden English headline named the Spanish page region | Remove the region name |
| P-31 | The download header was lost after a host redirect | A rule for both paths |
| P-32 | A zone-wide cache rule kept serving the old page | A bypass rule for the Bunker hostname; `no-cache` |
| P-33 | The seed guard missed numbered, upper-case and non-English seed phrases | Normalize tokens; letters of any script; CJK and Hangul words |
| P-34 | The guard missed WIF private keys of Dash and other coins | Any Base58Check token with a 33 or 34 byte payload |
| P-35 | The MCP server spoke only the handshake protocol revisions | Dual-era server: stateless 2026-07-28 plus the handshake revisions |
| P-36 | A label could carry invisible direction marks into the page | The parser removes control and direction characters |

## P-01. Stacks addresses were not recognized

**Problem.** A user pasted a Stacks address (`SP...`) from a wallet app. The tool said "Not recognized".

**Cause.** Stacks was not in the first list of networks. Stacks uses its own encoding, c32check, with the alphabet `0123456789ABCDEFGHJKMNPQRSTVWXYZ`.

**Options.**

| Option | For | Against |
|---|---|---|
| A. Match the shape (`SP` + 39 characters) | Fast to write | Accepts typos |
| B. Full c32check decode with the double SHA-256 checksum | Finds typos | More code (35 lines) |

**Fix.** Option B, in [src/core/c32.js](../src/core/c32.js).

**Why.** The tool must not rate an address with a typo. A wrong rating can lead to a wrong move. See [ADR-009](decisions/ADR-009-checksums.md).

**Test.** The Stacks burn address and a multisig address are in `test/fixtures/addresses.json`. The typo test changes one character and expects a failure.

## P-02. Starknet and Spark were missing

**Problem.** The same wallet also showed a Starknet address (`0x` + 64 hex) and a Spark address (`spark1...`). The tool did not know them.

**Options for Starknet.**

| Option | For | Against |
|---|---|---|
| A. Treat every 66-character `0x` address as Sui | Simple | Wrong for Aptos, IOTA and Starknet |
| B. Ask the user to pick the network | Always correct | One more click |
| C. Guess from the value | No click | Wrong guesses |

**Fix.** Option B. Starknet addresses are numbers below 2^251. In the 64-digit form, the first hex digit is 0 and the second is 0 to 7. In any other case, Starknet is not an option. The first version checked only the first digit (P-44).

**Spark.** A test address built with the Spark layout has the same prefix and length as a real one. This matches a Spark address that contains its 33-byte identity key. The rating is **visible**.

## P-03. Spark and Silent Payments shared the `sp` prefix

**Problem.** Old Spark addresses used the prefix `sp`. Bitcoin Silent Payments (BIP-352) also use `sp`.

**Options.**

| Option | For | Against |
|---|---|---|
| A. Treat all `sp1` addresses as Spark | Simple | Wrong for Silent Payments |
| B. Use the first data character | Correct: Silent Payments version 0 starts with `q`; Spark starts with `p` | One extra rule |

**Fix.** Option B, in [src/networks/bitcoin.js](../src/networks/bitcoin.js).

**Test.** The BIP-352 test vector is in the fixtures. It must show as "Silent Payment address".

## P-04. The guard blocked valid ICP account IDs

**Problem.** An Internet Computer account ID is 64 hex characters. A raw private key is also 64 hex characters. The guard cleared the input.

**Options.**

| Option | For | Against |
|---|---|---|
| A. Remove the 64-hex rule | ICP works | Raw private keys pass |
| B. Check the ICP CRC-32 first | ICP works, keys stay blocked | A random key passes 1 time in about 4 billion |
| C. Ask the user | Correct | The secret stays on screen while the user reads |

**Fix.** Option B. The chance that a random key has a valid ICP checksum is 1 in 2^32.

**Test.** `test/guard.test.js` has a real ICP account ID that must pass, and random hex that must be blocked.

## P-05. The guard almost blocked Sui and Aptos addresses

**Problem.** During the rewrite, a draft rule blocked `0x` + 64 hex as a private key. That is the normal format for Sui, Aptos, IOTA and Starknet.

**Fix.** The guard blocks only bare 64 hex with no prefix. The alert tells the user to add `0x` or `near:` if the text is an address.

**Test.** `0x` + 64 hex is in the "does not block" list in `test/guard.test.js`.

## P-06. Liquid confidential checksums were not verified

**Problem.** Liquid confidential addresses (`lq1...`) use Blech32, not Bech32. Blech32 has a 12-character checksum and other constants. The tool checked only the shape.

**Options.**

| Option | For | Against |
|---|---|---|
| A. Keep the shape check | No new code | Typos pass |
| B. Write the constants from memory | Fast | One wrong digit rejects all valid addresses |
| C. Copy the constants from the reference implementation and test against it | Correct | Needs a reference |

**Fix.** Option C. The constants come from the Blech32 library that Liquid wallets use. Test addresses from that library are in `test/fixtures/liquid-reference.json`. The tool now also separates Liquid Taproot (visible) from Liquid SegWit (hidden).

## P-07. Zcash shielded addresses had no rating

**Problem.** Zcash shielded addresses work differently. The address does not contain the spend key. We did not want to guess.

**Options.**

| Option | For | Against |
|---|---|---|
| A. No rating | Safe | No help for the user |
| B. Rate the address like Bitcoin | Simple | Wrong model |
| C. Rate the pool, with the Zcash developers' own analysis | Correct | Needs research |

**Fix.** Option C. The Zcash quantum-resilience draft (ZIP 2005) says that a discrete-log break could allow theft or counterfeit in the shielded pools. Sapling gets no recovery path. The Ironwood pool (NU6.3, July 28, 2026) supports quantum-recoverable notes.

- `zs1...` (Sapling): model `move-pool`. Plan: move to Ironwood.
- `u1...` (unified): model `ask-provider`. Plan: find the pool that holds the funds, then move Sapling and Orchard funds to Ironwood.

See [ADR-013](decisions/ADR-013-zcash-pools.md).

## P-08. Cosmos explorer links were wrong

**Problem.** The links used `mintscan.io/<network>/address/...`. Real Mintscan account pages use `/account/`.

**How we found it.** We searched for indexed Mintscan pages. All of them used `/account/`.

**Fix.** The link template now uses `/account/`. The weekly link check (`tools/check-links.js`) opens one link for each template.

## P-09. Two explorer links were not verified

**Problem.** The links for Spark and Provenance came from memory. We found no indexed page with that URL pattern.

**Options.** Keep them; replace them with a guess; remove them.

**Fix.** Remove them. A missing link is better than a broken link. See [ADR-014](decisions/ADR-014-explorer-links.md).

## P-10. Filecoin f4 addresses were not recognized

**Problem.** The rule read `f4` + Base32 text. But `f410f...` contains the digits `1` and `0`, which are not in the Base32 alphabet.

**Fix.** A separate rule for `f410f` + 39 Base32 characters.

**Test.** A sample `f410f` address in `test/networks.test.js`.

## P-11. Long formats failed the length limit

**Problem.** The Bech32 decoder had a limit of 90 characters (from BIP-173). Lightning invoices, Zcash unified addresses and MWEB addresses are longer.

**Fix.** The decoder takes a limit for each format. Bitcoin addresses keep strict rules. Lightning invoices allow up to 4,000 characters.

## P-12. Web fonts made third-party requests

**Problem.** The first page loaded fonts from Google Fonts. The page said "nothing leaves your device", but the browser contacted Google.

**Fix.** System fonts only. The Content Security Policy now blocks all fonts from outside (`font-src 'none'`). See [ADR-015](decisions/ADR-015-system-fonts.md).

## P-13. Ethereum typos were accepted

**Problem.** Any `0x` + 40 hex passed. A typo in a mixed-case address looked valid.

**Fix.** EIP-55: the capital letters encode a Keccak-256 checksum. The tool verifies them. An address in all lowercase or all uppercase carries no checksum, so the tool accepts it.

## P-14. People pasted token contracts

**Problem.** A user asked about QNT. Many people copy the token contract address (`0x4a22...4675`) instead of their wallet address. The tool rated the contract as a wallet.

**Options.**

| Option | For | Against |
|---|---|---|
| A. No list | No upkeep | Wrong rating |
| B. Full token list (thousands of contracts) | Complete | Large file, needs updates |
| C. Short list of the most common contracts | Small, solves the common case | Not complete |

**Fix.** Option C: QNT, USDT, USDC, PAXG, XAUT and WBTC on Ethereum, Tron and Solana. See [ADR-022](decisions/ADR-022-token-contracts.md).

## P-15. Short Stacks addresses were rejected

**Problem.** The Stacks burn address `SP000000000000000000002Q6VF78` is 29 characters. The rule required at least 30.

**Fix.** In c32, each leading zero byte is one `0` character, so addresses can be short. The rule now accepts 7 to 43 characters. The checksum does the real work.

## P-16. Bittensor addresses showed as Polkadot

**Problem.** All SS58 addresses had the label "Polkadot". Prefix 42 is the generic Substrate prefix. Bittensor uses it.

**Fix.** Read the SS58 prefix. The tool now names Polkadot, Kusama, Astar, Bifrost, Acala, Polymesh, Centrifuge, KILT, Bittensor and Hydration.

## P-17. Random Base58 text showed as Polkadot

**Problem.** Any Base58 text of 35 or 36 bytes got the label "Polkadot", with no checksum check.

**Fix.** Verify the SS58 checksum (BLAKE2b-512 over `SS58PRE` + data). Text that fails shows as "Checksum failed".

## P-18. The prototype built HTML strings

**Problem.** The prototype built cards with `innerHTML` and an escape function. One missed escape can cause cross-site scripting (XSS).

**Fix.** The page builds all elements with `document.createElement` and `textContent`. A test fails the build if `innerHTML`, `outerHTML`, `insertAdjacentHTML`, `document.write` or `eval` appears in the code. The Content Security Policy also turns on Trusted Types. See [ADR-019](decisions/ADR-019-safe-dom.md).

**Test.** In Chromium, we pasted `<img src=x onerror=alert(1)>` as a label. The page showed the text. It made no image.

## P-19. XRP, Stellar, Algorand and TON had no checksum check

**How we found it.** The typo test (P-01) changes one character of each real address. The XRP genesis account with a typo still showed as valid.

**Cause.** These four detectors matched only the shape.

**Fix.** Four validators:

| Network | Checksum |
|---|---|
| XRP | Base58Check with the Ripple alphabet |
| Stellar | CRC-16/XMODEM, little-endian |
| Algorand | Last 4 bytes of SHA-512/256 of the key |
| TON | CRC-16/XMODEM, big-endian |

Algorand needs SHA-512/256. We wrote it in [src/core/sha512.js](../src/core/sha512.js). Its constants are computed from their definitions, and the test compares it with Node's crypto library.

## P-20. Base32 accepted two spellings of one address

**How we found it.** After P-19, an Algorand address with a changed last character still passed.

**Cause.** 58 Base32 characters hold 290 bits. The address uses 288. The last character has 2 unused bits. If only those bits change, the bytes stay the same and the checksum passes.

**Fix.** The decoder accepts only the canonical form: unused bits must be zero.

**Test.** `test/core.test.js`: `base32Decode('ab')` must return null.

## P-21. The build rejected type notes in comments

**Problem.** The build stops if the code uses dynamic `import()`. Type notes in comments, such as `@returns {import('../model.js').Verdict}`, also matched.

**Fix.** The rule ignores comments.

## P-22. The docs had long sentences and mixed words

**Problem.** Early text had long sentences, em dashes, dramatic phrases, and different words for the same thing. This made the text slower to read and harder to audit.

**Fix.** All docs follow strict house writing rules: short sentences, active voice, one instruction in each sentence. A check fails on em dashes. See [WRITING-STYLE.md](WRITING-STYLE.md) and [ADR-021](decisions/ADR-021-writing-style.md).

## P-23. The tools allowed Node.js versions with known flaws

**Problem.** `package.json` said `engines: >=20`. On October 21, 2026, Node.js fixed ten flaws, one of them remote code execution in the Brotli decoder (CVE-2026-111497). Node.js 20 gets no fix. CI used the Node.js of the runner image, so the version was not under our control.

**Options.**

| Option | For | Against |
|---|---|---|
| A. Change `engines` only | One line | npm only warns; the build script ignores it |
| B. `actions/setup-node` | Common | A third-party action (ADR-023) |
| **C. A gate script, `engine-strict`, `.nvmrc`, and CI that installs the official build with a SHA-256 check** | Fails early on every computer | One table to update after each release |

**Fix.** Option C. See [ADR-026](decisions/ADR-026-node-version-gate.md) and [supply-chain.md](security/supply-chain.md).

## P-24. The link check could decompress data from any server

**Problem.** The weekly link check used `fetch()`. `fetch()` decompresses Brotli responses. A hostile or hacked explorer could send bad Brotli data to the CI runner. This is the attack path of CVE-2026-111497.

**Options.**

| Option | For | Against |
|---|---|---|
| A. Keep `fetch()` and trust the patched Node.js | No change | One defense only |
| B. Ask for `accept-encoding: identity` | Easy | A hostile server can ignore the request; `fetch()` still decompresses |
| **C. Use `node:https`, read only the status code, drop the body** | `node:https` never decompresses; nothing reaches a decoder | A few more lines for redirects |

**Fix.** Option C. A test fails if a tool uses `fetch()`, `node:zlib` or a Brotli function.

## P-25. Keyboard focus was lost after an answer

**Problem.** An answer ("Yes", "No") rebuilds the address rows. The button that had focus was removed, so a keyboard user went back to the top of the page.

**Options.**

| Option | For | Against |
|---|---|---|
| A. Change the rows in place | No focus loss | More code paths; easy to get out of sync |
| **B. Rebuild, then put focus on the same button of the same row** | One render path; a few lines | Focus moves to the results area after "Remove" |

**Fix.** Option B. The end-to-end test checks that focus stays on the pressed button.

## P-26. A host can change the HTML and break the CSP hashes

**Problem.** Some hosts and CDNs change HTML on the way to the user: they minify scripts, add analytics, or rewrite email addresses. A changed script does not match its CSP hash, so the browser blocks it and the page stops working.

**Options.**

| Option | For | Against |
|---|---|---|
| A. Allow `unsafe-inline` | Never breaks | Removes the main XSS protection |
| **B. Send `Cache-Control: no-transform`, and list the host features to turn off** | Keeps the strict CSP | One manual check for each host |

**Fix.** Option B. See step 3 in [hosting.md](security/hosting.md). A broken page is safer than a page that runs changed code.

## P-27. The font had no Spanish letters

**Problem.** The embedded font was cut to Basic Latin (ADR-024). Spanish text has á, é, í, ó, ú, ñ, ¿ and ¡. The browser drew those letters with a different font, so words looked mixed.

**Options.**

| Option | For | Against |
|---|---|---|
| A. Keep the font; accept the fallback letters | No change | Looks broken in Spanish |
| B. Embed the full font | Every language | About 650 KB |
| **C. Subset again with the Latin-1 Supplement** | All Spanish letters; 74 KB | A new pinned hash |

**Fix.** Option C. The build checks the new SHA-256 hash.

## P-28. A translation pattern matched across two sentences

**Problem.** The pattern "Same key on (list) and (last)." was tested on the whole text first. The text has two sentences, and the second one also contains "and". The pattern took the wrong "and", so half of the text stayed in English.

**Fix.** Pattern parts use `[^.]+`, so a part cannot cross the end of a sentence. `test/i18n.test.js` found the problem and now covers it.

## P-29. Field borders and one link were below WCAG minimums

**Problem.** The border of the address box had a contrast of about 1.4:1. WCAG 1.4.11 asks for 3:1 for the parts that show a control. The "Open in explorer" link was 23 pixels high. WCAG 2.5.8 asks for 24.

**Fix.** A new color token, `--field-line`, with 3:1 or more in both themes, for the address box, the value field, the answer buttons and the header switches. Links and small buttons have a minimum height of 24 pixels.

## P-30. A hidden English headline named the Spanish page region

**Problem.** The headline section used `aria-labelledby` to point at the English headline. In Spanish, that headline is hidden, but a screen reader still reads a hidden element that `aria-labelledby` names. Spanish users heard the English headline as the region name.

**Options.**

| Option | For | Against |
|---|---|---|
| A. Change `aria-labelledby` with the language | Keeps a region | One more thing to keep in sync |
| **B. Remove the region name** | Simple; the headline is already the first heading | The section is not a named region |

**Fix.** Option B.

## P-31. The download header was lost after a host redirect

**Problem.** Cloudflare Pages sends `/nosis-bunker.html` to `/nosis-bunker` with a 308 redirect. The `Content-Disposition` rule was only on the first path, so the browser opened the file instead of saving it.

**Fix.** `site/_headers` has the rule for both paths. Found by checking the live site after the first deploy.

## P-32. A zone-wide cache rule kept serving the old page

**Problem.** After the 1.2.0 deploy, the hosting preview had the new page, but `bunker.nosistech.com` still served the old one from the edge cache (`cf-cache-status: HIT`, age 44 minutes). A zone-wide cache rule for HTML matched every hostname in the zone.

**Options.**

| Option | For | Against |
|---|---|---|
| A. Purge the cache after each release | No rule change | A manual step that is easy to forget; users see old security text until then |
| B. Change the existing rule | One rule | Changes behavior for the whole zone |
| **C. Add a bypass rule for the Bunker hostname, placed last, and send `Cache-Control: no-cache`** | Each release is live at once; the rest of the zone does not change | One more rule in the zone |

**Fix.** Option C. See [hosting.md](security/hosting.md).

## The 1.2.1 review pass

Version 1.2.1 came from a review with four separate reviewers: network rules, security, Spanish and documentation. Each got the code and the specifications, not our conclusions, so the review did not grade our own work. Each entry below has the same four parts: how we found it, the options with what spoke for and against each one, the fix we chose, and the result.

| # | Problem | Severity | Result |
|---|---|---|---|
| P-33 | Numbered, upper-case and non-English seed phrases passed the guard | High | Blocked, nine forms and languages tested |
| P-34 | WIF keys of Dash and other coins passed the guard | High | Blocked for every coin |
| P-35 | The MCP server spoke only the handshake protocol revisions | Medium | Both protocol generations served |
| P-36 | A label could carry invisible direction marks into the page | Low | Removed everywhere |
| P-37 | A Bech32 address with a typo could pass as a Solana address | Critical | Reported as a checksum failure |
| P-38 | A list of labeled addresses could look like a seed phrase | Medium | Labels never trip the guard |
| P-39 | The agent report repeated text that was not an address | Medium | Shortened in every report |
| P-40 | The MCP server could be made to hold an unbounded buffer | Medium | 1 MB cap, replies flushed |
| P-41 | Ten formats accepted the wrong encoding or checksum | Medium | Each follows its specification |
| P-42 | The guard missed eight more key formats | High | 19 kinds of secrets blocked |

## P-33. The seed guard missed numbered, upper-case and non-English seed phrases

**How we found it.** The security review tried new inputs. "1. abandon 2. ability ..." (the way many people write a backup), "ABANDON ABILITY ..." and a Spanish BIP-39 phrase ("ábaco abdomen ...") all passed the guard.

**Cause.** The guard counted only lower-case tokens of 3 to 8 ASCII letters. Numbering tokens such as "1." counted against the 60 percent rule. Accented letters and other scripts did not count as words.

**Options.**

| Option | For | Against |
|---|---|---|
| A. Embed the ten BIP-39 word lists and match words exactly | No false positives from ordinary words | 20,480 words in the page (about 150 KB); a phrase with one typo passes; new word lists need a release |
| B. Match the English list only | Small | Nine languages pass |
| **C. Match the shape of a word in any script, with numbering removed** | No word list; covers all ten lists and the forms people write; small | Ordinary text of 12 or more words also looks like a phrase (see P-38) |

**Fix.** Option C. The guard lower-cases each token, drops numbering tokens, and counts a word as 3 to 8 letters in any script, one Chinese character, or 2 to 6 kana or Hangul syllables.

**Result.** Tests cover numbered, one-per-line, upper-case, comma-separated, Spanish, French, Chinese, Japanese and Korean phrases. All are blocked. The page stays under 300 KB.

## P-34. The guard missed WIF private keys of Dash and other coins

**How we found it.** The same review. The guard listed Dash (`0xcc`) as a WIF version, but the first-character filter (`5KLc69TQ`) did not include the Dash first characters `X` and `7`, so a Dash key passed.

**Options.**

| Option | For | Against |
|---|---|---|
| A. Extend the first-character list | One line | The same bug returns with the next coin |
| B. Keep a table of WIF version bytes | Exact | Must be maintained for more than 100 coins |
| **C. Decode every Base58 token of 51 or 52 characters and flag a 33 or 34 byte Base58Check payload** | No table; no public address has that shape, so the version byte does not matter | One more decode for each token of that length (microseconds) |

**Fix.** Option C.

**Result.** Keys for Bitcoin, Dash, Komodo and any other coin with a WIF format are blocked. Tests use keys built with the project's own encoder, so no real key is in the repository.

## P-35. The MCP server spoke only the handshake protocol revisions

**How we found it.** The security review compared the server with the current Model Context Protocol specification. The server implemented the `initialize` handshake of revisions 2025-11-25 and earlier. The current revision, 2026-07-28, is stateless: there is no handshake, every request names its version in `_meta`, servers must answer `server/discover`, results carry `resultType`, and list results carry cache hints. A modern client would have failed.

**Options.**

| Option | For | Against |
|---|---|---|
| A. Stay on the handshake revisions | No change | New clients cannot connect |
| B. Move to 2026-07-28 only | Simplest code | Clients that still use the handshake (most, in October 2026) cannot connect |
| **C. Dual-era: serve both** | Works with every client; this is what the specification recommends | A few more lines |

**Fix.** Option C. See [docs/10-agents.md](10-agents.md#protocol-versions).

**Result.** Tests cover `server/discover`, the per-request version, the unsupported-version error (`-32022` with the supported list), the missing-capabilities error, the cache hints, and the two legacy handshake versions. All pass.

## P-36. A label could carry invisible direction marks into the page

**How we found it.** The security review pasted a label with a right-to-left override character (`U+202E`). The text next to it displayed reversed. The agent report already removed such characters, but the page did not.

**Options.**

| Option | For | Against |
|---|---|---|
| A. Clean labels in the page renderer | Fixes the page | The CLI and the MCP server keep their own copy of the rule |
| **B. Clean labels once, in the parser that all three interfaces share** | One rule, one test, every interface | None |

**Fix.** Option B. The parser removes control, format and surrogate characters from every label.

**Result.** The page, the CLI and the MCP server all get clean labels. A test sends an escape sequence and a direction mark and checks the output.

## P-37. A Bech32 address with a typo could pass as a Solana address

**How we found it.** The network review tried a `bc1q...` address with one wrong character. It failed the Bech32 checksum, as it should. But the detector then returned nothing, and the next detector in the pipeline saw a string of 43 Base58 characters. That is a valid Solana shape, so the page reported "Solana account, lock visible" for a Bitcoin typo. This was the one critical finding of the pass: a wrong network with a wrong verdict, for a common typo.

**Options.**

| Option | For | Against |
|---|---|---|
| A. Move the Solana rule before the Bech32 rule | Small | Breaks the pipeline order; a valid Bech32 address could then be caught by the wrong rule |
| B. Exclude strings that start with `bc1` from the Solana rule | Small | Every other Bech32 prefix (`ltc1`, `addr1`, `cosmos1`, 45 Cosmos prefixes) has the same problem |
| **C. Stop the pipeline for any string with the shape of a Bech32 address whose checksum fails** | One rule for every prefix, now and later; the user gets "Checksum failed" with the reason | None found |

**Fix.** Option C. When the Bech32 decode fails, the detector looks at the shape: a prefix, a `1`, and only Bech32 characters. If the shape matches, it reports "Checksum failed" and stops the pipeline.

**Result.** The typo now reads "This looks like a Bech32 address, but the checksum is wrong. Look for a typo." A test holds this input and the ten wrong encodings of P-41.

## P-38. A list of labeled addresses could look like a seed phrase

**How we found it.** The rule from P-33 counted all words in the input. The security review pasted eight addresses with the label "savings for the house". That is more than 12 words, so the guard cleared a list of public addresses. A safe failure, but a user who loses a typed list once does not come back.

**Options.**

| Option | For | Against |
|---|---|---|
| A. Raise the threshold | Small | Still clears a long list; a real 12-word phrase next to four addresses passes |
| B. Count only lines with no address | Catches most lists | A phrase on the same line as an address passes |
| **C. Count the longest run of seed-looking words in a row** | A real phrase is always one run of 12 to 24 words; labels sit between addresses and never form a run that long | None found |

**Fix.** Option C.

**Result.** The labeled list passes. The nine phrase forms of P-33 are still blocked. Both are in the test suite.

## P-39. The agent report repeated text that was not an address

**How we found it.** The security review sent text that Bunker does not recognize through the CLI. The report returned that text in the `address` field. A secret in a format the guard does not know would then sit in the agent's context, and perhaps in its logs.

**Options.**

| Option | For | Against |
|---|---|---|
| A. Leave it; the guard already blocks 19 kinds of secrets | No change | The guard cannot know every format; an unknown secret is exactly the one that must not be repeated |
| B. Drop unrecognized entries from the report | Nothing leaks | The agent cannot tell the user which line was wrong |
| **C. Shorten unrecognized text to the first six and last three characters plus the length** | The user can find the line; a secret is not usable | None found |

**Fix.** Option C. A recognized address is public by definition and stays as given. The output schema says so.

**Result.** `this-is-not-an-address-but-could-be-a-secret-xyz` reads `this-i...xyz (48 characters)` in the CLI and the MCP server. A test checks both.

## P-40. The MCP server could be made to hold an unbounded buffer

**How we found it.** The security review read the transport code. The server read stdin with the standard line reader, which keeps a line in memory until the newline arrives. A client could send gigabytes without a newline. The server also exited as soon as stdin closed, so a reply still in the stdout buffer could be lost. The CLI had the same two gaps: `bunker /dev/zero` never ended.

**Options.**

| Option | For | Against |
|---|---|---|
| A. Keep the standard reader and check the length after the newline | Small | The buffer is already full by then |
| B. Use a stream-parsing library | Done for us | A dependency, against ADR-002 |
| **C. A small reader with a cap of 1 MB for each line, which drops the line as soon as the cap is passed** | 30 lines; no dependency; the memory bound holds at every moment | Our own code to test |

**Fix.** Option C, with a JSON-RPC error for the dropped line. On end of input the server lets the process finish on its own, so every reply is flushed. The CLI reads files and stdin in 64 KB chunks with the same cap, and rejects anything that is not a regular file.

**Result.** A 1.1 MB line gets `-32600 Message too large` and the server goes on. `bunker /dev/zero` ends at once with exit code 3 and the code `NOT_A_FILE`. A 100,001-character input gets `INPUT_TOO_LARGE`. Tests cover all three.

## P-41. Ten address formats accepted the wrong encoding or a wrong checksum

**How we found it.** The network review checked each format against its specification, one by one.

| Format | What was accepted | Now |
|---|---|---|
| SegWit | Version 0 in Bech32m, version 1 in Bech32, programs of any size | Checksum failed, with the reason |
| Silent Payments | Bech32 and any length | Bech32m and the exact length only |
| Zcash `zs`, `u`, `tex` | Either encoding | The encoding each one specifies |
| Cardano `addr`, `stake` | Any header byte | Payment headers 0 to 7 and the main network; stake headers 14 and 15 |
| Filecoin `f410` | Any 39 characters | The BLAKE2b checksum is verified, as for f1 to f3 |
| Ronin, XDC | Any capital letters | The EIP-55 checksum is verified, as for 0x addresses |
| TON `kQ`, `0Q` | Reported as a main network wallet | Test network, not rated |
| DigiByte `S...`, test network `m`, `n`, `2` | Unknown Base58 | Named |
| Solana System Program, Token Program | A wallet with a visible lock | A program, not a wallet, not rated |

**Options.**

| Option | For | Against |
|---|---|---|
| A. Accept the lenient forms; a wallet would never produce them | No change | A typo or a pasted fragment gets a confident verdict for the wrong thing |
| B. Reject them as "Not recognized" | Safe | The user does not learn what went wrong |
| **C. Reject them as "Checksum failed" with the reason in the message** | Safe, and the user knows what to look for | One message for each case, in two languages |

**Fix.** Option C for every row. The Solana programs went into a short list next to the token contracts. Explorers show them next to every transaction, so people paste them by mistake.

**Result.** One test input for each row. Each reads "Checksum failed" with its reason, or the right label, and never another network.

## P-42. The guard missed eight more key formats

**How we found it.** The security review went through the key formats of every supported network and the ways people store them.

**Options.**

| Option | For | Against |
|---|---|---|
| A. Keep the guard as it was and rely on the page text | No change | The page text is the last line, not the first |
| **B. Add one rule for each format, and split the input on the punctuation of JSON, shell and config files** | A key inside quotes, brackets or after `=` is one token, so the same rules catch it there too | More rules to keep; each needs a test |

**Fix.** Option B. The new rules block:

- XRP seeds (`s...`), BIP-38 encrypted keys (`6P...`) and Mina keys (`EK...`).
- Solana key files: a JSON list of 64 bytes.
- NEAR credential files: `ed25519:` plus a 64-byte key.
- PKCS#8 and SEC1 key bodies without their header line.
- Keys inside JSON quotes, brackets or after `=`.
- Seed phrases with numbering glued to the words, or invisible characters between them.

The `near:` prefix stays whole, because Bunker uses it to tell a NEAR account from a bare key.

**Result.** 19 kinds of secrets are blocked. The test suite has one input for each. It also has a NEAR public key and a Solana program address, to show that public data in the same shapes still passes.

## The 1.2.2 review pass

A documentation review compared the docs, the decision records and the tests with the code, one claim at a time. It found three gaps in the code and one gap in a test.

| # | Problem | Severity | Result |
|---|---|---|---|
| P-43 | Litecoin advice named a Bitcoin address type and a Bitcoin proposal | Medium | Litecoin advice names `ltc1q` |
| P-44 | Starknet was offered for values above 2^251 | Low | The value is checked in both forms |
| P-45 | The plan asked two of the three provider questions of ADR-012 | Low | The plan asks all three |
| P-46 | The P-37 test used a typo that could not reach the Solana rule | Low | A real case with the Solana shape |

## P-43. Litecoin advice named a Bitcoin address type and a Bitcoin proposal

**How we found it.** The review read every plan text next to each network. For a Litecoin MWEB address, the plan said to keep savings on a new `bc1q` address. For a Litecoin Taproot address, it said to be ready for BIP-360 outputs.

**Cause.** `waitAdvice()` in `src/advice.js` used one text for Bitcoin and Litecoin. `bc1q` is a Bitcoin address. BIP-360 is a Bitcoin proposal.

**Options.**

| Option | For | Against |
|---|---|---|
| A. One neutral text for both, such as "a new SegWit address" | One text | Less exact for Bitcoin users |
| **B. Separate texts for Bitcoin and Litecoin** | Each text names the right address type | Two more sentences to translate |

**Fix.** Option B. The Litecoin texts name `ltc1q` and do not mention BIP-360. The Bitcoin texts do not change.

**Result.** `test/plan.test.js` checks that Litecoin advice names `ltc1q` and never `bc1q` or BIP-360.

## P-44. Starknet was offered for values above 2^251

**How we found it.** The review compared the Starknet rule with its own comment. The comment said "below 2^251". The code checked only the first hex digit. The IOTA test address `0x6ff5...` got a Starknet button.

**Cause.** 2^251 is `0x08` followed by 62 zeros. In the 64-digit form, a Starknet address starts with `0`, and the second digit is 0 to 7. A first digit of 1 to 7 gives a value of 2^252 or more. The rule for 63 digits had the same gap for a first digit of 8 to f.

**Options.**

| Option | For | Against |
|---|---|---|
| A. Keep the check on the first digit | No change | Offers Starknet for addresses that cannot be Starknet |
| **B. Check the value against 2^251 in both forms** | Exact; two short conditions | None found |

**Fix.** Option B. The status does not change, because all four networks hide the key until the first transaction. Only the list of network buttons changes.

**Result.** A new test checks values just below 2^251, values at 2^251, and the IOTA fixture.

## P-45. The plan asked two of the three provider questions of ADR-012

**How we found it.** ADR-012 says that the plan text gives three questions word for word. The Canton plan text asked two of them. The question about a dated plan for post-quantum keys was missing.

**Fix.** The plan text now asks the three questions of ADR-012, in English and in Spanish.

**Result.** `test/plan.test.js` checks the three questions in the plan.

## P-46. The P-37 test used a typo that could not reach the Solana rule

**How we found it.** The test comment said that `bc1qw508...f3t5` is 43 Base58 characters long. It has 42 characters. It also contains `0`, which Base58 does not use. The Solana rule could never see this string, so the test did not show the danger of P-37.

**Fix.** The comment now says what the string is. A second case uses the DigiByte sample address with one changed character. Its 43 characters are all Base58 and decode to 32 bytes, so the Solana rule alone accepts it. The test checks that the pipeline reports a checksum failure first.

**Result.** We removed the Bech32 shape rule of P-37 in a copy of the code. The DigiByte typo then showed as a Solana account, and the test failed. With the rule, the test passes.
