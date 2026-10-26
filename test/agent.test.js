// Tests for the agent interfaces: the CLI, the MCP server and the website files for agents.
// They check the output shape, the exit codes, the secret guard, and that no network or
// file-write code exists (OWASP LLM06 excessive agency, MCP security best practices).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync, spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { TOOLS } from '../mcp/tools.js';
import { llmsTxt, networksJson } from '../tools/agent-files.js';
import { SITE_ORIGIN } from '../tools/site.js';

const SEED = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
const BTC = 'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4';

/** @param {string[]} args @param {string} input */
const cli = (args, input) => spawnSync(process.execPath, ['cli/bunker.js', ...args], { input, encoding: 'utf8' });

test('CLI: JSON report with a stable shape', () => {
  const r = cli(['--json', '--sent', BTC + '=no'], BTC + ' Savings\n');
  assert.equal(r.status, 0);
  const out = JSON.parse(r.stdout);
  assert.equal(out.ok, true);
  assert.equal(out.schemaVersion, 1);
  assert.equal(out.results[0].status, 'hidden');
  assert.equal(out.summary.lockHidden, 1);
  assert.match(out.attribution, /Bunker by NosisTech/);
});

test('CLI: a secret stops the run, exit code 2, and the secret is not repeated', () => {
  const r = cli(['--json'], SEED);
  assert.equal(r.status, 2);
  assert.equal(JSON.parse(r.stdout).error.code, 'SECRET_DETECTED');
  assert.ok(!r.stdout.includes('abandon') && !r.stderr.includes('abandon'));
});

test('CLI: usage errors give exit code 1, and Spanish works', () => {
  assert.equal(cli(['--lang', 'fr'], '').status, 1);
  assert.equal(cli(['--bogus'], '').status, 1);
  const r = cli(['--text', '--lang', 'es'], BTC + '\n');
  assert.match(r.stdout, /^PLAN BUNKER/);
});

test('CLI: control characters in labels are removed', () => {
  const out = JSON.parse(cli(['--json'], BTC + ' Sav\u001b[31mings‮\n').stdout);
  assert.equal(out.results[0].label, 'Sav[31mings');
});

test('CLI: text that is not an address is redacted in the report (P-39)', () => {
  const out = JSON.parse(cli(['--json'], 'this-is-not-an-address-but-could-be-a-secret-xyz\n').stdout);
  assert.equal(out.results[0].status, 'unknown');
  assert.match(out.results[0].address, /^this-i\.\.\.xyz \(\d+ characters\)$/);
  assert.ok(!JSON.stringify(out).includes('could-be-a-secret'));
});

test('CLI: oversized input and non-files give exit code 3', () => {
  const big = cli(['--json'], 'x'.repeat(100001) + '\n');
  assert.equal(big.status, 3);
  assert.equal(JSON.parse(big.stdout).error.code, 'INPUT_TOO_LARGE');
  const dir = cli(['--json', 'test'], '');
  assert.equal(dir.status, 3);
  assert.equal(JSON.parse(dir.stdout).error.code, 'NOT_A_FILE');
});

/**
 * Talk to the MCP server: send lines, collect one response for each request.
 * @param {object[]} messages
 * @param {string[]} [raw] extra raw lines
 */
function mcp(messages, raw = []) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, ['mcp/server.js'], { stdio: ['pipe', 'pipe', 'pipe'] });
    let out = '';
    child.stdout.on('data', d => { out += d; });
    child.on('error', reject);
    child.on('close', () => resolve(out.split('\n').filter(Boolean).map(l => JSON.parse(l))));
    for (const m of messages) child.stdin.write(JSON.stringify(m) + '\n');
    for (const l of raw) child.stdin.write(l + '\n');
    child.stdin.end();
  });
}

test('MCP: handshake, tool list and a scan', async () => {
  const res = await mcp([
    { jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2099-01-01', capabilities: {}, clientInfo: { name: 'test', version: '1' } } },
    { jsonrpc: '2.0', method: 'notifications/initialized' },
    { jsonrpc: '2.0', id: 2, method: 'tools/list' },
    { jsonrpc: '2.0', id: 3, method: 'tools/call', params: { name: 'scan_addresses', arguments: { addresses: [BTC + ' Savings'], answers: { [BTC]: 'no' } } } },
    { jsonrpc: '2.0', id: 4, method: 'tools/call', params: { name: 'list_networks', arguments: {} } },
  ]);
  assert.equal(res.length, 4, 'one response per request, nothing for the notification');
  assert.equal(res[0].result.protocolVersion, '2025-11-25', 'an unknown version gets the newest legacy version');
  assert.equal(res[0].result.serverInfo.name, 'bunker');
  const tools = res[1].result.tools;
  assert.deepEqual(tools.map(t => t.name), ['scan_addresses', 'list_networks']);
  for (const t of tools) assert.equal(t.annotations.readOnlyHint, true);
  assert.equal(res[2].result.isError, false);
  assert.equal(res[2].result.structuredContent.results[0].status, 'hidden');
  assert.ok(res[3].result.structuredContent.networks.length > 30);
});

test('MCP: the modern stateless protocol (2026-07-28): discover, per-request version, cache hints', async () => {
  const V = 'io.modelcontextprotocol/protocolVersion';
  const C = 'io.modelcontextprotocol/clientCapabilities';
  const meta = { [V]: '2026-07-28', [C]: {}, 'io.modelcontextprotocol/clientInfo': { name: 'test', version: '1' } };
  const res = await mcp([
    { jsonrpc: '2.0', id: 'd1', method: 'server/discover', params: { _meta: meta } },
    { jsonrpc: '2.0', id: 2, method: 'tools/list', params: { _meta: meta } },
    { jsonrpc: '2.0', id: 3, method: 'tools/call', params: { name: 'scan_addresses', arguments: { addresses: [BTC] }, _meta: meta } },
    { jsonrpc: '2.0', id: 4, method: 'tools/list', params: { _meta: { [V]: '1900-01-01', [C]: {} } } },
    { jsonrpc: '2.0', id: 5, method: 'tools/list', params: { _meta: { [V]: '2026-07-28' } } },
    { jsonrpc: '2.0', id: 6, method: 'tools/call', params: { name: 'scan_addresses', arguments: { addresses: 'no' }, _meta: meta } },
  ]);
  const d = res[0].result;
  assert.equal(d.resultType, 'complete');
  assert.deepEqual(d.supportedVersions, ['2026-07-28']);
  assert.ok(d.capabilities.tools);
  assert.equal(typeof d.ttlMs, 'number');
  assert.equal(d.cacheScope, 'public');
  assert.equal(d._meta['io.modelcontextprotocol/serverInfo'].name, 'bunker');
  assert.equal(res[1].result.resultType, 'complete');
  assert.equal(res[1].result.ttlMs, 3600000);
  assert.equal(res[2].result.resultType, 'complete');
  assert.equal(res[2].result.isError, false);
  assert.equal(res[3].error.code, -32022, 'unsupported version');
  assert.deepEqual(res[3].error.data.supported, ['2026-07-28']);
  assert.equal(res[4].error.code, -32602, 'missing client capabilities');
  assert.equal(res[5].result.isError, true);
  assert.equal(res[5].result.structuredContent.ok, false, 'error results still conform to the output schema');
});

test('MCP: the older legacy version is answered as asked', async () => {
  const res = await mcp([
    { jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'test', version: '1' } } },
    { jsonrpc: '2.0', method: 'tools/list' },
    { jsonrpc: '2.0', id: 2, method: 'ping' },
  ]);
  assert.equal(res.length, 2, 'a notification for a request method gets no reply');
  assert.equal(res[0].result.protocolVersion, '2025-06-18');
  assert.deepEqual(Object.keys(res[1].result).sort(), ['_meta', 'resultType']);
});

test('MCP: secrets, bad input and bad messages are handled safely', async () => {
  const big = JSON.stringify({ jsonrpc: '2.0', id: 9, method: 'ping', params: { x: 'a'.repeat(1100000) } });
  const res = await mcp([
    { jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name: 'scan_addresses', arguments: { text: SEED } } },
    { jsonrpc: '2.0', id: 2, method: 'tools/call', params: { name: 'scan_addresses', arguments: { addresses: 'not an array' } } },
    { jsonrpc: '2.0', id: 3, method: 'tools/call', params: { name: 'delete_everything', arguments: {} } },
    { jsonrpc: '2.0', id: 4, method: 'resources/list' },
    { jsonrpc: '2.0', id: { bad: true }, method: 'ping' },
    { jsonrpc: '2.0', id: 5, method: 'tools/call', params: { name: 'scan_addresses', arguments: { text: 'x'.repeat(100001) } } },
    { jsonrpc: '2.0', id: 6, method: 'tools/call', params: { name: 'scan_addresses', arguments: { text: SEED, lang: 'es' } } },
    { jsonrpc: '2.0', id: 7, method: 'tools/call', params: { name: 'scan_addresses', arguments: { text: 'not-an-address-maybe-a-secret-abc' } } },
  ], ['not json', big]);
  assert.equal(res[0].result.isError, true);
  assert.equal(res[0].result.structuredContent.error.code, 'SECRET_DETECTED');
  assert.ok(!JSON.stringify(res).includes('abandon'), 'the secret is never repeated');
  assert.equal(res[1].result.isError, true);
  assert.equal(res[2].error.code, -32602);
  assert.ok(!res[2].error.message.includes('delete_everything'), 'the tool name is not echoed');
  assert.equal(res[3].error.code, -32601);
  assert.equal(res[4].error.code, -32600, 'an object id is not a valid id');
  assert.equal(res[5].result.structuredContent.error.code, 'INPUT_TOO_LARGE');
  assert.match(res[6].result.structuredContent.error.message, /frase semilla/);
  assert.ok(!JSON.stringify(res[7]).includes('maybe-a-secret'), 'unrecognized text is redacted (P-39)');
  assert.equal(res[8].error.code, -32700);
  assert.equal(res[9].error.code, -32600, 'a message over 1 MB is dropped');
});

test('agent code has no network, shell or file-write access', () => {
  for (const f of ['cli/bunker.js', 'mcp/server.js', 'mcp/tools.js', 'src/agent/report.js']) {
    const code = readFileSync(f, 'utf8');
    assert.ok(!/node:(https?|http2|net|tls|dgram|child_process|worker_threads|vm)\b|\bfetch\(|writeFile|appendFile|createWriteStream|\beval\(|new Function/.test(code), f);
  }
});

test('tool descriptions contain no hidden or steering text (tool poisoning)', () => {
  const all = JSON.stringify(TOOLS);
  assert.ok(!/\p{Cf}/u.test(all), 'invisible characters');
  assert.ok(!/ignore (all|previous)|system prompt|<\/?[a-z]+>/i.test(all), 'steering text');
});

test('website files for agents match a fresh build', () => {
  const version = JSON.parse(readFileSync('package.json', 'utf8')).version;
  assert.equal(readFileSync('site/llms.txt', 'utf8'), llmsTxt(SITE_ORIGIN, version));
  assert.equal(readFileSync('site/networks.json', 'utf8'), networksJson(SITE_ORIGIN));
  assert.match(readFileSync('site/robots.txt', 'utf8'), /Sitemap: https:\/\/bunker\.nosistech\.com\/sitemap\.xml/);
});
