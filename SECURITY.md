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
| The file is the published file. | Compare the SHA-256 hash of your file with `dist/SHA256SUMS.txt`. |
| The website serves the published file. | Download <https://bunker.nosistech.com/nosis-bunker.html> and compare its hash. |
| The build tools are safe to run. | Zero npm packages; a Node.js version gate; see [supply chain](docs/security/supply-chain.md). |

## What the tool does not promise

- It does not protect a device that has malware.
- It does not guarantee that a network will not change its rules.
- It is not financial, legal or security advice.

## Details

- [OWASP mapping](docs/security/owasp.md)
- [Threat model](docs/security/threat-model.md)
- [Hosting headers](docs/security/hosting.md)
- [Standards](docs/security/standards.md)
