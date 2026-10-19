import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { expect, it, describe } from '@rstest/core';
import { DebugRpcClient } from '../src/debug-rpc';
import { schemaExample } from '../src/debug-schema';
import { proxyFixtureRpc } from '../scripts/fixture-rpc.mjs';
import { readRpcResponse } from './browser/rpc';

describe('debug-render', () => {
  it('renders the shipped debugger without a global React variable', () => {
    const html = execFileSync(
      process.execPath,
      [
        '--input-type=module',
        '-e',
        `
    import { createElement } from 'react';
    import { renderToStaticMarkup } from 'react-dom/server';
    import { McpDebugger } from './dist/esm/debug.mjs';
    if ('React' in globalThis) throw new Error('Unexpected React global');
    console.log(renderToStaticMarkup(createElement(McpDebugger, { endpoint: '/mcp' })));
  `,
      ],
      {
        cwd: fileURLToPath(new URL('..', import.meta.url)),
        encoding: 'utf8',
      },
    );
    expect(html).toContain('MCP Apps Debugger');
    expect(html).toContain('Connect &amp; discover');
  });
});

describe('debug-rpc', () => {
  it('preserves sessions, sends initialized notifications and reads SSE results after notifications', async () => {
    const requests: Array<{ headers: Headers; body: any }> = [];
    const client = new DebugRpcClient(new URL('http://localhost/mcp'), (async (
      _url,
      init,
    ) => {
      requests.push({
        headers: new Headers(init?.headers),
        body: JSON.parse(String(init?.body)),
      });
      if (requests.length === 1)
        return Response.json(
          { jsonrpc: '2.0', result: {} },
          { headers: { 'Mcp-Session-Id': 'test-session' } },
        );
      if (requests.length === 2) return new Response(null, { status: 202 });
      return new Response(
        'event: message\r\ndata: {"method":"notifications/progress"}\r\n\r\nevent: message\r\ndata: {"result":{"tools":[]}}\r\n\r\n',
        { headers: { 'content-type': 'text/event-stream' } },
      );
    }) as typeof fetch);
    await client.request('initialize', {});
    await client.request('notifications/initialized', undefined, true);
    expect(await client.request('tools/list')).toEqual({ tools: [] });
    expect(requests[1].body.id).toBeUndefined();
    expect(requests[2].headers.get('Mcp-Session-Id')).toBe('test-session');
  });

  it('reports HTTP and MCP errors instead of displaying them as tool results', async () => {
    for (const response of [
      new Response('unavailable', { status: 503 }),
      Response.json({ error: { message: 'Invalid arguments' } }),
    ]) {
      const client = new DebugRpcClient(
        new URL('http://localhost/mcp'),
        (async () => response) as typeof fetch,
      );
      await expect(client.request('tools/call', {})).rejects.toThrow();
    }
  });

  it('invokes fetch with the global receiver required by browsers', async () => {
    const fetcher = async function (this: unknown) {
      if (this !== globalThis) throw new TypeError('Illegal invocation');
      return Response.json({ jsonrpc: '2.0', result: { tools: [] } });
    };
    const client = new DebugRpcClient(
      new URL('http://localhost/mcp'),
      fetcher as typeof fetch,
    );
    expect(await client.request('tools/list')).toEqual({ tools: [] });
  });
});

describe('debug-schema', () => {
  it('creates editable arguments from required keys, defaults and enum values', () => {
    expect(
      schemaExample({
        type: 'object',
        required: ['name', 'count', 'settings'],
        properties: {
          name: { type: 'string' },
          count: { type: 'integer', minimum: 1 },
          mode: { type: 'string', default: 'all' },
          optional: { type: 'string' },
          settings: {
            type: 'object',
            properties: {
              active: { type: 'boolean' },
              color: { enum: ['red', 'blue'] },
            },
          },
        },
      }),
    ).toEqual({
      name: '',
      count: 1,
      mode: 'all',
      settings: { active: false, color: 'red' },
    });
  });

  it('handles empty inputs and schema examples', () => {
    expect(schemaExample({ type: 'object' })).toEqual({});
    expect(schemaExample({ examples: [{ title: 'A task' }] })).toEqual({
      title: 'A task',
    });
  });
});

describe('fixture-rpc', () => {
  describe('test host connection diagnostics', () => {
    it('preserves empty accepted notification responses', async () => {
      const response = await proxyFixtureRpc(
        'http://localhost/mcp',
        '{}',
        async () => new Response(null, { status: 202 }),
      );
      expect(response.status).toBe(202);
      expect(await readRpcResponse(response)).toBeUndefined();
    });
    it('shows the selected endpoint and connection error rather than a JSON parse failure', async () => {
      const response = await proxyFixtureRpc(
        'http://127.0.0.1:8080/mcp',
        '{}',
        async () => {
          throw new Error('fetch failed', { cause: { code: 'ECONNREFUSED' } });
        },
      );
      expect(response.status).toBe(502);
      await expect(readRpcResponse(response)).rejects.toThrow(
        'http://127.0.0.1:8080/mcp: ECONNREFUSED',
      );
    });
    it('reports non-JSON upstream errors with their HTTP status', async () => {
      const response = await proxyFixtureRpc(
        'http://localhost/mcp',
        '{}',
        async () => new Response('Not found', { status: 404 }),
      );
      await expect(readRpcResponse(response)).rejects.toThrow(
        'HTTP 404, not JSON: Not found',
      );
    });
    it('handles old test-host plain-text failures without hiding the error', async () => {
      await expect(
        readRpcResponse(new Response('Fixture failed', { status: 500 })),
      ).rejects.toThrow('HTTP 500, not JSON: Fixture failed');
    });
    it('preserves successful JSON-RPC results', async () => {
      const response = await proxyFixtureRpc(
        'http://localhost/mcp',
        '{}',
        async () =>
          Response.json({ jsonrpc: '2.0', id: 1, result: { tools: [] } }),
      );
      expect(await readRpcResponse(response)).toEqual({ tools: [] });
    });
  });
});
