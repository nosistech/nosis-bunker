# Decision records

A decision record tells why the project works the way it does. Each record has the same parts:

1. **Context.** The problem.
2. **Options.** Two or more ways to solve it, with the points for and against.
3. **Decision.** The option that we chose.
4. **Reasons.** Why we chose it.
5. **Consequences.** What the choice makes easy, and what it makes hard.

Status values: **Accepted** (in use), **Proposed** (to confirm), **Replaced** (no longer in use).

| Record | Title | Status |
|---|---|---|
| [ADR-001](ADR-001-offline-client-only.md) | Run everything on the user's device | Accepted |
| [ADR-002](ADR-002-language.md) | Write the tool in JavaScript | Accepted |
| [ADR-003](ADR-003-no-dependencies.md) | Use no third-party libraries | Accepted |
| [ADR-004](ADR-004-single-html-file.md) | Deliver one HTML file | Accepted |
| [ADR-005](ADR-005-build-script.md) | Use a small build script of our own | Accepted |
| [ADR-006](ADR-006-detector-pipeline.md) | Organize networks as an ordered detector pipeline | Accepted |
| [ADR-007](ADR-007-exposure-model.md) | Use named exposure models | Accepted |
| [ADR-008](ADR-008-ask-instead-of-lookup.md) | Ask the user instead of a blockchain lookup | Accepted |
| [ADR-009](ADR-009-checksums.md) | Verify every checksum | Accepted |
| [ADR-010](ADR-010-secret-guard.md) | Block and clear secrets | Accepted |
| [ADR-011](ADR-011-shared-formats.md) | Let the user pick the network for shared formats | Accepted |
| [ADR-012](ADR-012-permissioned-networks.md) | Give questions, not ratings, for permissioned networks | Accepted |
| [ADR-013](ADR-013-zcash-pools.md) | Rate Zcash shielded funds by pool | Accepted |
| [ADR-014](ADR-014-explorer-links.md) | Show only verified explorer links | Accepted |
| [ADR-015](ADR-015-system-fonts.md) | Use system fonts | Replaced by ADR-024 |
| [ADR-016](ADR-016-content-security-policy.md) | Use a strict Content Security Policy with hashes | Accepted |
| [ADR-017](ADR-017-bigint.md) | Use BigInt for 64-bit math | Accepted |
| [ADR-018](ADR-018-tests.md) | Test with node:test and real addresses | Accepted |
| [ADR-019](ADR-019-safe-dom.md) | Build the page with DOM methods only | Accepted |
| [ADR-020](ADR-020-page-design.md) | Page design: cards, words and example data | Accepted |
| [ADR-021](ADR-021-writing-style.md) | Write the docs with strict house writing rules | Accepted |
| [ADR-022](ADR-022-token-contracts.md) | Keep a short list of token contracts | Accepted |
| [ADR-023](ADR-023-ci-without-third-party-actions.md) | Run CI with no third-party actions | Accepted |
| [ADR-024](ADR-024-embedded-font.md) | Embed one open-license font in the page | Accepted |
| [ADR-025](ADR-025-prebuilt-site.md) | Publish a prebuilt website folder | Accepted |
| [ADR-026](ADR-026-node-version-gate.md) | Pin and gate the Node.js version of the tools | Accepted |
| [ADR-027](ADR-027-agent-interfaces.md) | Agent interfaces: local CLI and MCP server, no web API | Accepted |
| [ADR-028](ADR-028-two-languages.md) | English and Spanish, with one engine language | Accepted |
| [ADR-029](ADR-029-preferences-without-storage.md) | Language and theme switches that store nothing | Accepted |
| [ADR-030](ADR-030-accessibility.md) | Accessibility: WCAG 2.2 AA, tested, with no overlay | Accepted |
