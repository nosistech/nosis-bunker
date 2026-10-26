# ADR-023. Run CI with no third-party actions

Status: Accepted. Date: 2026-10-25.

## Context

GitHub Actions workflows often use actions from the marketplace, such as `actions/checkout` and `actions/setup-node`. A workflow that uses a tag (for example `@v4`) runs whatever code the tag points to on that day. Attackers have changed tags of popular actions to steal secrets.

## Options

| Option | For | Against |
|---|---|---|
| A. Marketplace actions with version tags | Short workflows | The tag can move to new code at any time |
| B. Marketplace actions pinned to a full commit SHA | The code cannot change | Still third-party code; pins need updates |
| **C. No third-party actions: plain `git` and the Node.js that the runner already has** | No third-party code in CI | A few more lines in the workflow |

## Decision

Option C. See [.github/workflows/ci.yml](../../.github/workflows/ci.yml).

## Reasons

- This follows the OWASP Top 10 CI/CD Security Risks: limit third-party code and limit token permissions.
- The project has no dependencies, so it needs no package install step.

## Consequences

- Each workflow sets `permissions: contents: read`.
- CI builds the page, runs the tests, runs the writing check, and fails if the committed `dist/` file differs from a fresh build.
- A weekly workflow checks the explorer links ([ADR-014](ADR-014-explorer-links.md)).
