# 02. How it works

Bunker does five steps. Each step is one module. Each step has one job.

```text
input text
   |
   v
1. guard.js       Is there a secret?  -> yes: clear the input and stop
   |
   v
2. parse.js       Split into lines, labels and duplicates
   |
   v
3. classify.js    For each address: run the detectors in order
   |
   v
4. model.js       Model + your answer -> card status
   |
   v
5. plan.js        Status -> ordered plan
```

## Step 1. Look for secrets (guard.js)

The guard reads the whole input before any other step. It looks for:

- Seed phrases (12 or more short lowercase words).
- Private keys in many formats: WIF, xprv, raw hex, Solana, Stellar, Nostr, Cardano, Tezos, Mina, Stacks, PEM files and encrypted wallet files.

If the guard finds a secret, the page clears the input box and shows a warning. The secret never leaves the page.

**Example.** You paste `abandon abandon ... about` (12 words). The guard returns "a seed phrase". The page clears the box.

**Special case.** Some valid addresses look like private keys. An Internet Computer account ID is 64 hex characters, like a private key. The guard examines its CRC-32 checksum first. If the checksum is correct, the text is an address, not a key.

## Step 2. Read the lines (parse.js)

- One address on each line.
- The text after the first space is the label (maximum 40 characters).
- The tool skips a duplicate address.
- The tool reads at most 500 lines and 100,000 characters. This keeps the page fast.

**Example.** `bc1q... My savings` gives the address `bc1q...` and the label `My savings`.

## Step 3. Find the network (classify.js and networks/)

`classify()` runs 17 small detectors in a fixed order. The first detector that recognizes the address gives the answer. Read the order and the reasons in [src/networks/index.js](../src/networks/index.js).

Each detector does two things:

1. It recognizes the format (the prefix, the length and the characters).
2. It verifies the checksum, if the format has one.

If the checksum is wrong, the result is "Checksum failed". The tool does not rate an address with a typo.

**Example.** `bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4` goes through the detectors. The Bech32 detector decodes it. The prefix is `bc`, the witness version is 0, and the program has 20 bytes. The result: Bitcoin, Native SegWit, model `hidden-until-used`.

## Step 4. Give the status (model.js)

Each result has a **model**. The model tells how the network exposes the key:

| Model | Meaning | Status |
|---|---|---|
| `visible` | The key is visible from day one. | Lock visible |
| `hidden-until-used` | The key appears when the address sends or signs. | Your answer decides |
| `hash-safe` | No curve key to recover. | Hash-protected |
| `move-pool` | The pool is at risk, and a safer pool exists. | Lock visible |
| `ask-provider` | Permissioned network, or the answer is outside the address. | Ask your provider (or the network's own label, such as Check your pool) |
| `xpub` | An extended public key. | Shows every key |
| `unknown` | Not a wallet, a typo, or a test network. | Not rated |

For `hidden-until-used`, the card asks: "Has it ever sent a transaction or signed a message?"

- "No" gives **Lock hidden**.
- "Yes" gives **Lock visible**.
- "Not sure" gives **Check needed**. Open the explorer link to find out.

## Step 5. Make the plan (plan.js and advice.js)

The plan has the same order every time:

1. **Ground rules.** Always first.
2. **Move to new addresses.** Visible locks that a new address can hide. The highest value comes first.
3. **Visible with no hidden option yet.** For example Taproot, Solana and Monero, with what to do now.
4. **Check or ask.** Addresses with unknown answers, and permissioned networks.
5. **Stop sharing extended public keys.**
6. **Keep these locks hidden.**
7. **Watch for the real fixes.** Always last.

**Example.** Your daily Ethereum wallet ($6,400) has sent. Your Solana account ($2,200) is visible by design. The plan puts the Ethereum wallet in group 2 and the Solana account in group 3.

## What the tool does not do

- It does not look up balances or transactions. You type the values and the answers. See [ADR-008](decisions/ADR-008-ask-instead-of-lookup.md).
- It does not move funds. It only gives a plan.
- It does not rate private bank networks with no public addresses. See [ADR-012](decisions/ADR-012-permissioned-networks.md).
