#!/usr/bin/env node
// @ts-check
// Bunker MCP server. Transport: stdio (one JSON-RPC 2.0 message on each line).
// Read-only and offline: no network code, no files written, no shell, no secrets kept.
// stdout carries protocol messages only. Logs go to stderr.
//
// The server serves two generations of the protocol ("dual-era", as the specification calls it):
//   - Modern (2026-07-28): stateless. Every request carries its protocol version in _meta.
//     The client can call server/discover first. Results carry resultType and the server identity.
//   - Legacy (2025-11-25 and earlier): the client starts with an initialize handshake.
// See docs/10-agents.md and docs/decisions/ADR-027-agent-interfaces.md.
import { readFileSync } from 'node:fs';
import { buildReport, listNetworks } from '../src/agent/report.js';
import { MAX_INPUT_CHARS, MAX_LINES } from '../src/parse.js';
import { TOOLS, SERVER_INSTRUCTIONS } from './tools.js';

/** Modern protocol versions (per-request metadata, no handshake), newest first. */
export const MODERN_VERSIONS = Object.freeze(['2026-07-28']);
/** Legacy protocol versions (initialize handshake), newest first. Older revisions required JSON-RPC batches, which this server does not speak. */
export const LEGACY_VERSIONS = Object.freeze(['2025-11-25', '2025-06-18']);
const META_VERSION = 'io.modelcontextprotocol/protocolVersion';
const META_CLIENT_CAPS = 'io.modelcontextprotocol/clientCapabilities';
const META_SERVER_INFO = 'io.modelcontextprotocol/serverInfo';
/** The tool list never changes while the server runs, so clients can cache it for an hour. */
const CACHE = Object.freeze({ ttlMs: 3600000, cacheScope: 'public' });
const MAX_MESSAGE_BYTES = 1024 * 1024;
const VERSION = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')).version;
const SERVER_INFO = Object.freeze({
  name: 'bunker',
  title: 'Bunker by NosisTech',
  version: VERSION,
  description: 'Offline check of public crypto addresses: which ones expose their public key, and a plan.',
  websiteUrl: 'https://bunker.nosistech.com',
});
const CAPABILITIES = Object.freeze({ tools: { listChanged: false } });

/** @param {string} message */
function log(message) {
  process.stderr.write('[bunker-mcp] ' + message + '\n');
}

/** @param {object} msg */
function send(msg) {
  process.stdout.write(JSON.stringify(msg) + '\n');
}

/**
 * @param {unknown} id
 * @param {number} code
 * @param {string} message
 * @param {object} [data]
 */
function sendError(id, code, message, data) {
  const error = data ? { code, message, data } : { code, message };
  send({ jsonrpc: '2.0', id: id === undefined ? null : id, error });
}

/**
 * Send a result. Every result carries resultType and the server identity (2026-07-28).
 * Legacy clients ignore the extra fields.
 * @param {unknown} id
 * @param {object} result
 */
function sendResult(id, result) {
  send({ jsonrpc: '2.0', id, result: { resultType: 'complete', ...result, _meta: { [META_SERVER_INFO]: SERVER_INFO } } });
}

/**
 * A tool result. isError marks a problem that the agent can fix (it is not a protocol error).
 * Every result has structuredContent, because both tools declare an outputSchema.
 * @param {object} data
 * @param {string} text
 * @param {boolean} [isError]
 */
function toolResult(data, text, isError = false) {
  return { content: [{ type: 'text', text }], structuredContent: data, isError };
}

/** @param {string} code @param {string} message */
function toolError(code, message) {
  return toolResult({ ok: false, error: { code, message } }, message, true);
}

/**
 * Check and run the scan_addresses tool.
 * @param {Record<string, unknown>} args
 */
function runScan(args) {
  const { addresses, text, answers, lang } = args;
  if (addresses !== undefined && (!Array.isArray(addresses) || addresses.length > MAX_LINES || addresses.some(a => typeof a !== 'string'))) {
    return toolError('INVALID_ARGUMENTS', 'addresses must be an array of at most ' + MAX_LINES + ' strings.');
  }
  if (text !== undefined && typeof text !== 'string') return toolError('INVALID_ARGUMENTS', 'text must be a string.');
  if (addresses === undefined && text === undefined) return toolError('INVALID_ARGUMENTS', 'Give addresses (an array) or text (one address on each line).');
  if (lang !== undefined && lang !== 'en' && lang !== 'es') return toolError('INVALID_ARGUMENTS', 'lang must be en or es.');
  /** @type {Record<string, string>} */
  const ans = Object.create(null);
  if (answers !== undefined) {
    if (!answers || typeof answers !== 'object' || Array.isArray(answers)) return toolError('INVALID_ARGUMENTS', 'answers must be an object: address -> yes, no or unsure.');
    for (const [k, v] of Object.entries(answers)) {
      if (v !== 'yes' && v !== 'no' && v !== 'unsure') return toolError('INVALID_ARGUMENTS', 'Each answer must be yes, no or unsure.');
      ans[k] = v;
    }
  }
  const input = [Array.isArray(addresses) ? addresses.join('\n') : '', typeof text === 'string' ? text : ''].filter(Boolean).join('\n');
  if (input.length > MAX_INPUT_CHARS) return toolError('INPUT_TOO_LARGE', 'The input is longer than ' + MAX_INPUT_CHARS + ' characters.');
  const res = buildReport(input, { lang: typeof lang === 'string' ? lang : 'en', answers: ans });
  if (!res.ok) return toolError(res.code, res.message);
  const data = { ok: true, ...res.report };
  return toolResult(data, JSON.stringify(data));
}

/**
 * Handle one message. Returns nothing; replies go through send().
 * @param {{ id?: unknown, method?: unknown, params?: any }} msg
 */
function handle(msg) {
  const { id, method } = msg;
  const params = msg.params && typeof msg.params === 'object' && !Array.isArray(msg.params) ? msg.params : {};
  const meta = params._meta && typeof params._meta === 'object' ? params._meta : {};
  const isRequest = id !== undefined && id !== null;
  const requested = typeof meta[META_VERSION] === 'string' ? meta[META_VERSION] : null;

  // A modern request names its protocol version. Check it before anything else.
  if (requested !== null) {
    if (!MODERN_VERSIONS.includes(requested)) {
      if (isRequest) sendError(id, -32022, 'Unsupported protocol version', { supported: [...MODERN_VERSIONS], requested });
      return;
    }
    if (isRequest && (meta[META_CLIENT_CAPS] === undefined || typeof meta[META_CLIENT_CAPS] !== 'object')) {
      sendError(id, -32602, 'Invalid params: _meta is missing ' + META_CLIENT_CAPS);
      return;
    }
  }

  // Every method below answers a request. A notification (no id) for one of them gets no reply.
  if (!isRequest && method !== 'notifications/initialized' && method !== 'notifications/cancelled') return;

  switch (method) {
    case 'server/discover':
      return sendResult(id, { supportedVersions: [...MODERN_VERSIONS], capabilities: CAPABILITIES, instructions: SERVER_INSTRUCTIONS, ...CACHE });
    case 'initialize': {
      // Legacy handshake. Answer with the version the client asked for, or the newest legacy version.
      const asked = typeof params.protocolVersion === 'string' ? params.protocolVersion : '';
      const protocolVersion = LEGACY_VERSIONS.includes(asked) ? asked : LEGACY_VERSIONS[0];
      return sendResult(id, { protocolVersion, capabilities: CAPABILITIES, serverInfo: SERVER_INFO, instructions: SERVER_INSTRUCTIONS });
    }
    case 'notifications/initialized':
    case 'notifications/cancelled':
      return undefined;
    case 'ping':
      return sendResult(id, {});
    case 'tools/list':
      return sendResult(id, { tools: TOOLS, ...CACHE });
    case 'tools/call': {
      const name = params.name;
      const args = params.arguments && typeof params.arguments === 'object' && !Array.isArray(params.arguments) ? params.arguments : {};
      if (name === 'scan_addresses') return sendResult(id, runScan(args));
      if (name === 'list_networks') {
        const data = listNetworks();
        return sendResult(id, toolResult(data, JSON.stringify(data)));
      }
      // The name is not repeated: it is client input.
      return sendError(id, -32602, 'Unknown tool');
    }
    default:
      if (isRequest) return sendError(id, -32601, 'Method not found');
      return undefined;
  }
}

/**
 * Read stdin line by line with a cap. A line longer than MAX_MESSAGE_BYTES is dropped as soon as the
 * cap is passed, so a client cannot make the server hold an unbounded buffer (P-40).
 * @param {(line: string) => void} onLine
 */
function readLines(onLine) {
  /** @type {Buffer[]} */
  let chunks = [];
  let size = 0;
  let dropping = false;
  process.stdin.on('data', chunk => {
    let start = 0;
    for (;;) {
      const nl = chunk.indexOf(10, start);
      const piece = nl === -1 ? chunk.subarray(start) : chunk.subarray(start, nl);
      if (!dropping) {
        size += piece.length;
        if (size > MAX_MESSAGE_BYTES) { dropping = true; chunks = []; size = 0; sendError(null, -32600, 'Message too large'); }
        else chunks.push(piece);
      }
      if (nl === -1) return;
      if (!dropping) {
        const line = Buffer.concat(chunks).toString('utf8');
        chunks = [];
        size = 0;
        onLine(line);
      }
      dropping = false;
      start = nl + 1;
    }
  });
  process.stdin.on('end', () => {
    if (!dropping && size) onLine(Buffer.concat(chunks).toString('utf8'));
    // No process.exit() here: pending stdout writes must flush first. The process ends on its own.
    process.exitCode = 0;
  });
}

function main() {
  // A client that closes the pipe early must not crash the server with a stack trace.
  process.stdout.on('error', () => process.exit(0));
  readLines(line => {
    if (!line.trim()) return;
    let msg;
    try {
      msg = JSON.parse(line);
    } catch {
      return sendError(null, -32700, 'Parse error');
    }
    if (!msg || typeof msg !== 'object' || Array.isArray(msg) || msg.jsonrpc !== '2.0') {
      const badId = msg && typeof msg === 'object' && !Array.isArray(msg) && (typeof msg.id === 'string' || typeof msg.id === 'number') ? msg.id : null;
      return sendError(badId, -32600, 'Invalid request');
    }
    // MCP: a request id is a string or a number, never null.
    if ('id' in msg && typeof msg.id !== 'string' && typeof msg.id !== 'number') return sendError(null, -32600, 'Invalid request: id must be a string or a number');
    try {
      handle(msg);
    } catch (err) {
      // Never print the input. It can contain a secret that the guard did not catch.
      log('internal error: ' + (err instanceof Error ? err.name : 'error'));
      if (msg.id !== undefined) sendError(msg.id, -32603, 'Internal error');
    }
  });
  log('ready (stdio). Version ' + VERSION + '. Protocol: ' + MODERN_VERSIONS[0] + ' and legacy ' + LEGACY_VERSIONS.join(', ') + '.');
}

main();
