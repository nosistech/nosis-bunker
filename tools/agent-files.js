// @ts-check
// Files for AI agents and search engines on the website: llms.txt, networks.json, sitemap.xml.
// See docs/10-agents.md and docs/decisions/ADR-027-agent-interfaces.md.
import { listNetworks } from '../src/agent/report.js';

/**
 * llms.txt (format from llmstxt.org): what the site is, in plain Markdown, with links.
 * @param {string} origin
 * @param {string} version
 */
export function llmsTxt(origin, version) {
  return `# Bunker by NosisTech

> Bunker is a free, offline scanner for public crypto addresses. It shows which addresses expose their public key ("the lock") and gives a calm, step-by-step plan to hide what can be hidden. More than 100 networks, with checksum validation. English and Spanish. Version ${version}.

Important for agents:

- Bunker needs PUBLIC addresses only. Never send, ask for or store a seed phrase or private key. Bunker rejects them.
- The web page runs in the browser and sends nothing. There is no web API on this site. To call Bunker from an agent, run the local CLI or the local MCP server (below).
- Results are educational, not financial advice. When you show results, credit "Bunker by NosisTech" with a link to ${origin}.

## Use

- [Web app](${origin}/): paste addresses, answer one question for some addresses, get a plan.
- [Offline copy](${origin}/nosis-bunker.html): the same single HTML file, for use with no internet connection.
- [Supported networks (JSON)](${origin}/networks.json): network ids, names, exposure models and explorer link formats.

## Local tools for agents

Get the code: \`git clone https://github.com/nosistech/nosis-bunker.git\` (no dependencies, Node.js 22.23.4, 24.22.1 or 26.12.1, or a newer release of the same line (24 is the tested one)). Setup guide: [docs/10-agents.md](https://github.com/nosistech/nosis-bunker/blob/main/docs/10-agents.md).

- CLI: \`node cli/bunker.js --json addresses.txt\` prints a JSON report (schemaVersion 1). Exit code 2 means the input looked like a secret and nothing was processed.
- MCP server (stdio): \`node mcp/server.js\`. Tools: \`scan_addresses\` (addresses, optional answers and lang) and \`list_networks\`. Both are read-only and offline.

## Exposure models

${Object.entries(listNetworks().models).map(([k, v]) => '- ' + k + ': ' + v).join('\n')}

## Optional

- [Source code](https://github.com/nosistech/nosis-bunker) (Apache License 2.0)
- [Security contact](${origin}/.well-known/security.txt)
- Publisher: NosisTech LLC, https://nosistech.com, info@nosistech.com
`;
}

/** @param {string} origin */
export function networksJson(origin) {
  return JSON.stringify({ ...listNetworks(), source: origin + '/networks.json' }, null, 2) + '\n';
}

/**
 * @param {string} origin
 * @param {string} date YYYY-MM-DD
 */
export function sitemapXml(origin, date) {
  return '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    + '  <url><loc>' + origin + '/</loc><lastmod>' + date + '</lastmod></url>\n'
    + '  <url><loc>' + origin + '/llms.txt</loc><lastmod>' + date + '</lastmod></url>\n'
    + '</urlset>\n';
}
