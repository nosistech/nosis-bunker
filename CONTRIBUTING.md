# Contributing

Thank you for your help. Read these rules before you change the code.

## Rules

1. **No dependencies.** Do not add packages to `package.json`. See [ADR-003](docs/decisions/ADR-003-no-dependencies.md).
2. **No network code in the page.** No `fetch`, no `XMLHttpRequest`, no `WebSocket`.
3. **No storage.** No `localStorage`, no cookies.
4. **No HTML strings.** Use `uiEl()` and `textContent`. Never use `innerHTML`.
5. **Small modules.** Keep each core, network and pipeline module under 100 lines. One module, one job.
6. **Real test data.** A new network needs a real public address with its source in `test/fixtures/addresses.json`. Do not use a private person's address.
7. **Verified links only.** Add an explorer link only after you open a real page with that URL pattern.
8. **Docs follow the writing rules.** Follow [docs/WRITING-STYLE.md](docs/WRITING-STYLE.md). No em dashes.

## Steps for a change

1. Make the change.
2. Type `npm run check`. All tests must pass.
3. Commit the new `dist/` and `site/` files too. CI fails if they differ from a fresh build.
4. Update the docs: `docs/03-networks.md` for a network, a decision record for a design change, `docs/06-problems-and-fixes.md` for a bug fix.
5. Add a line to `CHANGELOG.md`.

## Add a network

Follow the steps in [docs/04-architecture.md](docs/04-architecture.md#how-to-add-a-network).
