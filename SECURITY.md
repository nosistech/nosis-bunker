# Security policy

## Report a problem

If you find a security problem, do not open a public issue.

1. Send an email to <info@nosistech.com>. The address is also in <https://bunker.nosistech.com/.well-known/security.txt>.
2. Write what you found, the steps to see it, and the version (the SHA-256 hash in `dist/SHA256SUMS.txt`).
3. We answer within 5 working days.

Do not include a real seed phrase or private key in a report.

## What the tool promises

| Promise | How you can verify it |
|---|---|
| It sends nothing. | Open the page with no internet connection. It works. The CSP contains `connect-src 'none'`. |
| It stores nothing. | The code contains no `localStorage`, cookies or IndexedDB. A test proves it. |
| It runs only our code. | The CSP allows only scripts and styles with the exact SHA-256 hashes from the build. |
| The file is the published file. | Compare the SHA-256 hash of your file with `dist/SHA256SUMS.txt` or <https://bunker.nosistech.com/SHA256SUMS.txt>. Then check the Sigstore signature with the steps below. |
| The website serves the published file. | Download <https://bunker.nosistech.com/nosis-bunker.html> and compare its hash. |
| The build tools are safe to run. | Zero npm packages; a Node.js version gate; see [supply chain](docs/security/supply-chain.md). |

## Verify a download

A copy of the file can be fake. Use the three steps below. The page at <https://bunker.nosistech.com> shows the same steps.

1. Download `nosis-bunker.html`, `SHA256SUMS.txt` and `SHA256SUMS.txt.sigstore.json` from the GitHub release: <https://github.com/nosistech/nosis-bunker/releases/latest>. The hash list for the live site is <https://bunker.nosistech.com/SHA256SUMS.txt>.
2. Check the hash. On Linux, run `sha256sum -c SHA256SUMS.txt`. On macOS, run `shasum -a 256 -c SHA256SUMS.txt`. On Windows, run `Get-FileHash .\nosis-bunker.html -Algorithm SHA256` and compare the hash. The check must succeed.
3. Install cosign from <https://github.com/sigstore/cosign/releases>. Put the version of the file in place of `X.Y.Z`. Then run:

   ```text
   cosign verify-blob --bundle SHA256SUMS.txt.sigstore.json --certificate-identity https://github.com/nosistech/nosis-bunker/.github/workflows/release.yml@refs/tags/vX.Y.Z --certificate-oidc-issuer https://token.actions.githubusercontent.com SHA256SUMS.txt
   ```

The certificate identity is `https://github.com/nosistech/nosis-bunker/.github/workflows/release.yml@refs/tags/vX.Y.Z`. The OIDC issuer is `https://token.actions.githubusercontent.com`. The command must succeed.

Check the signature against the `SHA256SUMS.txt` from the release. That is the file the signature covers. A release made before this signing step has no signature file. The hash check still works for that release.

## What the tool does not promise

- It does not protect a device that has malware.
- It does not guarantee that a network will not change its rules.
- It is not financial, legal or security advice.

## Details

- [OWASP mapping](docs/security/owasp.md)
- [Threat model](docs/security/threat-model.md)
- [Hosting headers](docs/security/hosting.md)
- [Standards](docs/security/standards.md)
