import fs from 'node:fs/promises';
import path from 'node:path';
import readline from 'node:readline';
import type { Readable, Writable } from 'node:stream';
import { assertHttpUrl, isRecord } from '../manifest';

export interface StdioBridgeOptions {
  /** Target Streamable HTTP MCP endpoint, e.g. http://localhost:8088/api/mcp */
  url?: string;
  /** Resolve target URL dynamically (e.g. from .modern-js/mcp-apps/dev-server.json). */
  resolveUrl?: () => Promise<string>;
  /** Extra HTTP headers forwarded on every upstream request. */
  headers?: Record<string, string>;
  /** Optional per-request timeout in milliseconds. 0 or undefined disables timeout. */
  timeoutMs?: number;
  input?: Readable;
  output?: Writable;
  error?: Writable;
  fetch?: typeof globalThis.fetch;
}

export interface ParsedStdioCliArgs {
  url?: string;
  cwd?: string;
  headers: Record<string, string>;
  timeoutMs?: number;
  help: boolean;
}

export function parseStdioCliArgs(argv: string[]): ParsedStdioCliArgs {
  const headers: Record<string, string> = {};
  let url: string | undefined;
  let cwd: string | undefined;
  let timeoutMs: number | undefined;
  let help = false;

  const nextValue = (flag: string, index: number) => {
    const value = argv[index + 1];
    if (value === undefined) throw new Error(`Missing value for ${flag}`);
    return value;
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '-h' || arg === '--help') {
      help = true;
    } else if (arg === '--url') {
      url = nextValue(arg, i++);
    } else if (arg.startsWith('--url=')) {
      url = arg.slice('--url='.length);
    } else if (arg === '--cwd') {
      cwd = nextValue(arg, i++);
    } else if (arg.startsWith('--cwd=')) {
      cwd = arg.slice('--cwd='.length);
    } else if (arg === '-H' || arg === '--header') {
      addHeader(headers, nextValue(arg, i++));
    } else if (arg.startsWith('--header=')) {
      addHeader(headers, arg.slice('--header='.length));
    } else if (arg === '--timeout') {
      timeoutMs = parseTimeout(nextValue(arg, i++));
    } else if (arg.startsWith('--timeout=')) {
      timeoutMs = parseTimeout(arg.slice('--timeout='.length));
    } else if (arg.startsWith('-')) {
      throw new Error(`Unknown option: ${arg}`);
    } else if (!url) {
      url = arg;
    } else {
      throw new Error(`Unexpected argument: ${arg}`);
    }
  }

  if (url) assertHttpUrl(url);
  return { url, cwd, headers, timeoutMs, help };
}

function addHeader(headers: Record<string, string>, raw: string) {
  const separator = raw.indexOf(':');
  if (separator <= 0)
    throw new Error(`Invalid header "${raw}". Use "Name: Value" format`);
  const name = raw.slice(0, separator).trim();
  const value = raw.slice(separator + 1).trim();
  if (!name) throw new Error(`Invalid header "${raw}". Header name is empty`);
  headers[name] = value;
}

function parseTimeout(raw: string): number {
  const value = Number(raw);
  if (!Number.isFinite(value) || value < 0)
    throw new Error(`Invalid --timeout value: ${raw}`);
  return value;
}

export async function readDevServerUrl(cwd: string): Promise<string> {
  const infoPath = path.resolve(cwd, '.modern-js/mcp-apps/dev-server.json');
  let raw: string;
  try {
    raw = await fs.readFile(infoPath, 'utf8');
  } catch {
    throw new Error(
      `Cannot find dev server info at ${infoPath}. Start \`modern dev\` first or pass an explicit URL.`,
    );
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error(`Invalid JSON in ${infoPath}`);
  }
  if (!isRecord(parsed) || typeof parsed.url !== 'string')
    throw new Error(`Missing "url" field in ${infoPath}`);
  return assertHttpUrl(parsed.url).href;
}

interface JsonRpcRequestLike {
  jsonrpc?: string;
  id?: string | number | null;
  method?: string;
}

function expectsResponse(message: unknown): message is JsonRpcRequestLike & {
  id: string | number;
} {
  return (
    isRecord(message) &&
    typeof message.method === 'string' &&
    (typeof message.id === 'string' || typeof message.id === 'number')
  );
}

function jsonRpcError(
  id: string | number | null,
  code: number,
  message: string,
) {
  return { jsonrpc: '2.0', id, error: { code, message } };
}

/**
 * Transport-level stdio <-> Streamable HTTP JSON-RPC bridge.
 * Forwards MCP JSON-RPC messages transparently without stripping extensions or `_meta`.
 */
export function createStdioBridge(options: StdioBridgeOptions) {
  const input = options.input ?? process.stdin;
  const output = options.output ?? process.stdout;
  const errorOut = options.error ?? process.stderr;
  const fetchImpl = options.fetch ?? globalThis.fetch;
  const staticUrl = options.url ? assertHttpUrl(options.url).href : undefined;
  const resolveUrl =
    options.resolveUrl ?? (staticUrl ? async () => staticUrl : undefined);
  if (!resolveUrl)
    throw new Error('Either url or resolveUrl is required for stdio bridge');

  let sessionId: string | undefined;
  let lastUrl = staticUrl;
  let closed = false;
  const controller = new AbortController();
  const inFlight = new Set<Promise<void>>();

  const writeError = (text: string) => {
    errorOut.write(`[modern-mcp-stdio] ${text}\n`);
  };

  const writeJson = (value: unknown) => {
    if (closed) return;
    output.write(`${JSON.stringify(value)}\n`);
  };

  const emitResponsePayload = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    try {
      const parsed = JSON.parse(trimmed);
      writeJson(parsed);
    } catch (err) {
      writeError(
        `Ignored non-JSON upstream payload: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  };

  const consumeSse = async (body: ReadableStream<Uint8Array>) => {
    const reader = body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let dataLines: string[] = [];

    const flushEvent = () => {
      if (!dataLines.length) return;
      const payload = dataLines.join('\n');
      dataLines = [];
      emitResponsePayload(payload);
    };

    const processLine = (line: string) => {
      if (line === '') {
        flushEvent();
        return;
      }
      if (line.startsWith(':')) return;
      if (line.startsWith('data:')) {
        const value = line.slice(5);
        dataLines.push(value.startsWith(' ') ? value.slice(1) : value);
      }
    };

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let newlineIndex: number;
        while ((newlineIndex = buffer.search(/\r\n|\n|\r/)) !== -1) {
          const line = buffer.slice(0, newlineIndex);
          const skip =
            buffer[newlineIndex] === '\r' && buffer[newlineIndex + 1] === '\n'
              ? 2
              : 1;
          buffer = buffer.slice(newlineIndex + skip);
          processLine(line);
        }
      }
      buffer += decoder.decode();
      if (buffer.length) processLine(buffer);
      flushEvent();
    } finally {
      reader.releaseLock();
    }
  };

  const buildSignal = () => {
    if (options.timeoutMs && options.timeoutMs > 0)
      return AbortSignal.any([
        controller.signal,
        AbortSignal.timeout(options.timeoutMs),
      ]);
    return controller.signal;
  };

  const handleMessage = async (rawLine: string) => {
    let parsed: unknown;
    try {
      parsed = JSON.parse(rawLine);
    } catch (err) {
      writeJson(
        jsonRpcError(
          null,
          -32700,
          `Parse error: ${err instanceof Error ? err.message : String(err)}`,
        ),
      );
      return;
    }

    const requestId = expectsResponse(parsed) ? parsed.id : undefined;

    let targetUrl: string;
    try {
      targetUrl = assertHttpUrl(await resolveUrl()).href;
      lastUrl = targetUrl;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      writeError(message);
      if (requestId !== undefined)
        writeJson(jsonRpcError(requestId, -32000, message));
      return;
    }

    const headers = new Headers(options.headers);
    headers.set('content-type', 'application/json');
    headers.set('accept', 'application/json, text/event-stream');
    if (sessionId) headers.set('mcp-session-id', sessionId);

    let response: Response;
    try {
      response = await fetchImpl(targetUrl, {
        method: 'POST',
        headers,
        body: rawLine,
        signal: buildSignal(),
      });
    } catch (err) {
      if (controller.signal.aborted) return;
      const reason = err instanceof Error ? err.message : String(err);
      const message = `Cannot reach MCP HTTP server at ${targetUrl} (${reason}). Ensure \`modern dev\` is running.`;
      writeError(message);
      if (requestId !== undefined)
        writeJson(jsonRpcError(requestId, -32000, message));
      return;
    }

    const returnedSession = response.headers.get('mcp-session-id');
    if (returnedSession) sessionId = returnedSession;
    else if (response.status === 404 && sessionId) sessionId = undefined;

    if (response.status === 202 || response.status === 204) {
      await response.body?.cancel().catch(() => {});
      return;
    }

    const contentType = (
      response.headers.get('content-type') ?? ''
    ).toLowerCase();

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      try {
        const errorBody = JSON.parse(text);
        if (isRecord(errorBody) && 'error' in errorBody) {
          writeJson(
            requestId !== undefined && errorBody.id === undefined
              ? { ...errorBody, id: requestId }
              : errorBody,
          );
          return;
        }
      } catch {
        // Fall through to synthesized JSON-RPC error.
      }
      const snippet = text.trim().slice(0, 200);
      const message = `Upstream MCP server returned HTTP ${response.status} from ${targetUrl}${snippet ? `: ${snippet}` : ''}`;
      writeError(message);
      if (requestId !== undefined)
        writeJson(jsonRpcError(requestId, -32000, message));
      return;
    }

    if (contentType.includes('text/event-stream') && response.body) {
      await consumeSse(response.body);
      return;
    }

    const text = await response.text();
    emitResponsePayload(text);
  };

  const closeSession = async () => {
    if (!sessionId || !lastUrl) return;
    const id = sessionId;
    sessionId = undefined;
    const headers = new Headers(options.headers);
    headers.set('mcp-session-id', id);
    await fetchImpl(lastUrl, {
      method: 'DELETE',
      headers,
      signal: AbortSignal.timeout(2_000),
    }).catch(() => {});
  };

  const rl = readline.createInterface({ input, crlfDelay: Infinity });

  const done = new Promise<void>(resolve => {
    rl.on('line', line => {
      const trimmed = line.trim();
      if (!trimmed) return;
      const task = handleMessage(trimmed)
        .catch(err => {
          writeError(err instanceof Error ? err.message : String(err));
        })
        .finally(() => {
          inFlight.delete(task);
        });
      inFlight.add(task);
    });

    rl.on('close', async () => {
      await Promise.allSettled(inFlight);
      await closeSession();
      closed = true;
      resolve();
    });
  });

  const close = async () => {
    if (closed) return;
    controller.abort();
    rl.close();
    await done;
  };

  return { done, close };
}

const USAGE = `Usage: modern-mcp-stdio [url] [options]

Forward MCP JSON-RPC messages over stdio to a running Modern.js HTTP MCP endpoint.

Options:
  --url <url>          Target MCP HTTP endpoint (e.g. http://localhost:8088/api/mcp)
  --cwd <dir>          Modern.js app directory (reads .modern-js/mcp-apps/dev-server.json)
  -H, --header <h>     Extra HTTP header in "Name: Value" format (repeatable)
  --timeout <ms>       Optional per-request timeout in milliseconds
  -h, --help           Show this help message
`;

export async function runStdioBridgeCli(argv = process.argv.slice(2)) {
  let parsed: ParsedStdioCliArgs;
  try {
    parsed = parseStdioCliArgs(argv);
  } catch (err) {
    process.stderr.write(
      `[modern-mcp-stdio] ${err instanceof Error ? err.message : String(err)}\n\n${USAGE}`,
    );
    process.exitCode = 1;
    return;
  }

  if (parsed.help) {
    process.stderr.write(USAGE);
    return;
  }

  if (!parsed.url && !parsed.cwd) {
    process.stderr.write(
      `[modern-mcp-stdio] Provide a target MCP URL or --cwd <app-dir>.\n\n${USAGE}`,
    );
    process.exitCode = 1;
    return;
  }

  const bridge = createStdioBridge({
    url: parsed.url,
    resolveUrl: parsed.url ? undefined : () => readDevServerUrl(parsed.cwd!),
    headers: parsed.headers,
    timeoutMs: parsed.timeoutMs,
  });

  const onSignal = () => {
    void bridge.close();
  };
  process.once('SIGINT', onSignal);
  process.once('SIGTERM', onSignal);

  try {
    await bridge.done;
  } finally {
    process.off('SIGINT', onSignal);
    process.off('SIGTERM', onSignal);
  }
}
