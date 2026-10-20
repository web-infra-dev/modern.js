import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { expect, it, describe } from '@rstest/core';
import { McpInspectorClient } from '../src/inspector/client';
import { schemaExample } from '../src/inspector/schema';

describe('inspector-render', () => {
  it('renders the shipped inspector without a global React variable', () => {
    const html = execFileSync(
      process.execPath,
      [
        '--input-type=module',
        '-e',
        `
    import { createElement } from 'react';
    import { renderToStaticMarkup } from 'react-dom/server';
    import { McpInspector } from './dist/esm/inspector.mjs';
    if ('React' in globalThis) throw new Error('Unexpected React global');
    console.log(renderToStaticMarkup(createElement(McpInspector, { endpoint: '/mcp' })));
  `,
      ],
      {
        cwd: fileURLToPath(new URL('..', import.meta.url)),
        encoding: 'utf8',
      },
    );
    expect(html).toContain('MCP Apps Inspector');
    expect(html).toContain('Connect &amp; discover');
  });
});

describe('inspector-client', () => {
  it('preserves sessions, sends initialized notifications and reads SSE results after notifications', async () => {
    const requests: Array<{ headers: Headers; body: any }> = [];
    const client = new McpInspectorClient(
      new URL('http://localhost/mcp'),
      (async (_url, init) => {
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
      }) as typeof fetch,
    );
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
      const client = new McpInspectorClient(
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
    const client = new McpInspectorClient(
      new URL('http://localhost/mcp'),
      fetcher as typeof fetch,
    );
    expect(await client.request('tools/list')).toEqual({ tools: [] });
  });
});

describe('inspector-schema', () => {
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
