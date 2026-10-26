# Standards and frameworks

This document lists the standards that relate to Bunker, and how each one applies. Status is as of October 25, 2026.

## Post-quantum and hash-based cryptography

| Standard | What it says | How it relates |
|---|---|---|
| NIST FIPS 203, 204, 205 (August 2024) | ML-KEM, ML-DSA (lattice) and SLH-DSA (hash-based) | SLH-DSA is the hash-based approach that Ethereum researchers prefer. The "watch" list in the plan follows the move to these schemes. |
| NIST SP 800-208 | Stateful hash-based signatures (LMS, XMSS) | Background for hash-based signatures. |
| NIST IR 8547 (draft) | Deprecate classic public-key algorithms by 2030; disallow by 2035 | The questions for permissioned networks ask for a dated plan against these years. |
| NIST CSWP 39 (final) | Crypto agility: the ability to change algorithms | The question "can the keys change?" in the plan. Networks that can rotate keys get a separate note. |
| NSA CNSA 2.0 | Quantum-resistant algorithms for national security systems from 2027; complete by 2035 | Context for government holders. |
| EU coordinated PQC roadmap | National strategies by end of 2026; high-risk systems by 2030; medium-risk by 2035 | Context for EU institutions. |
| UK NCSC PQC timeline | Discovery by 2028; priority migration by 2031; complete by 2035 | Context for UK institutions. |

## Digital asset custody

| Standard | How it relates |
|---|---|
| CryptoCurrency Security Standard (CCSS) v9 | Key generation, storage, use and compromise response. It has no quantum or key-exposure controls yet. Bunker results can feed a CCSS-based review. |
| MiCA (EU) | The transition period ended on July 1, 2026. Custody providers in the EU need a license. |
| DORA (EU) | ICT risk and third-party risk for financial firms, including crypto firms. |
| ISO/IEC 27001:2022, SOC 2 | The baseline that institutional clients expect from a vendor. |

## Application security

| Standard | How it relates |
|---|---|
| OWASP Top 10:2025, ASVS 5.0, Cheat Sheets, CI/CD Top 10 | See [owasp.md](owasp.md). |
| SLSA and OpenSSF Scorecard | Future work: signed releases and build provenance. |
| Model Context Protocol, revision 2026-07-28 | The MCP server speaks this stateless revision (`server/discover`, per-request version, `resultType`, cache hints) and the older handshake revisions. See [ADR-027](../decisions/ADR-027-agent-interfaces.md). |
| OWASP Top 10 for LLM Applications (2025) | The agent interfaces are mapped item by item in [owasp.md](owasp.md). |

## Software law in the EU

These are facts about the laws, not legal advice. They explain why Bunker stays free, collects no personal data and publishes its code.

| Law | What it says | How it relates |
|---|---|---|
| Product Liability Directive (EU) 2024/2853 | Software is a product. Member states apply it from December 9, 2026. Free and open-source software supplied outside a commercial activity is out of scope. | Bunker is free, open source, and takes no personal data. |
| Cyber Resilience Act (EU) 2024/2847 | Security rules for products with digital elements. Reporting duties from September 2026; full application from December 2027. Free and open-source software is out of scope when it is supplied outside a commercial activity. | Same position as above. The project still follows the practices the act asks for: a security contact, a vulnerability policy, no known-exploitable flaws at release. |
| European Accessibility Act (EU) 2019/882 | Accessibility rules for listed consumer services since June 28, 2025. | Bunker is not a listed service. It follows WCAG 2.2 AA anyway. See [ADR-030](../decisions/ADR-030-accessibility.md). |

## AI governance

Bunker has no AI in it. These standards do not apply to the scanner today. They will apply if a future version adds an AI assistant.

| Standard | Status | When it applies |
|---|---|---|
| ISO/IEC 42001:2023 | AI management system, certifiable | A future AI feature |
| ISO/IEC 42005:2025 | AI system impact assessment | A future AI feature |
| NIST AI RMF 1.0 and AI 600-1 (Generative AI Profile) | Current | A future AI feature |
| NIST IR 8596 (Cyber AI Profile) | Draft | A future AI feature |
| EU AI Act (with the 2026 Digital Omnibus) | Transparency duties from August 2, 2026 (December 2, 2026 for systems already on the market); stand-alone high-risk rules from December 2, 2027 | A future AI feature offered in the EU must tell users that they talk to an AI. |
| OWASP Top 10 for LLM Applications and for Agentic Applications | Current | A future AI feature: treat pasted addresses as untrusted input. |
