import {
  Client,
  StreamableHTTPClientTransport,
} from '@modelcontextprotocol/client';
import { describe, expect, it } from '@rstest/core';
import { createMcpBffHandler } from '../src/bff';
import { createMcpHandler } from '../src/server';

const definition = {
  remotes: [],
  tools: [{ name: 'count', handler: () => ({ structuredContent: [1, 2, 3] }) }],
};

function request(method: string, params: Record<string, unknown> = {}) {
  const headers = new Headers({
    'content-type': 'application/json',
    accept: 'application/json, text/event-stream',
    'mcp-protocol-version': '2026-07-28',
    'mcp-method': method,
  });
  const name = params.name ?? params.uri;
  if (typeof name === 'string') headers.set('mcp-name', name);
  return new Request('http://localhost/mcp', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method,
      params: {
        ...params,
        _meta: {
          'io.modelcontextprotocol/protocolVersion': '2026-07-28',
          'io.modelcontextprotocol/clientCapabilities': {},
          'io.modelcontextprotocol/clientInfo': {
            name: 'protocol-test',
            version: '1',
          },
        },
      },
    }),
  });
}

describe('MCP 2026-07-28', () => {
  it('interoperates with the official client and serves standard UI resources', async () => {
    const handle = createMcpHandler(
      {
        remotes: [
          {
            name: 'cards',
            baseUrl: 'https://cdn.example.com/mf-manifest.json',
            csp: { resourceDomains: ['https://cdn.example.com'] },
          },
        ],
        tools: [
          {
            name: 'card',
            remote: 'cards',
            view: { module: './Card' },
            handler: () => ({
              structuredContent: { message: 'hello' },
              viewProps: { message: 'hello' },
            }),
          },
        ],
      },
      { resourceHtml: '<html><body>card</body></html>' },
    );
    const client = new Client(
      { name: 'sdk-interop', version: '1' },
      { versionNegotiation: { mode: { pin: '2026-07-28' } } },
    );
    const transport = new StreamableHTTPClientTransport(
      new URL('http://localhost/mcp'),
      {
        fetch: async (input, init) => handle(new Request(input, init)),
      },
    );
    try {
      await client.connect(transport);
      expect(client.getNegotiatedProtocolVersion()).toBe('2026-07-28');
      const tools = await client.listTools();
      expect(tools.tools[0]._meta?.ui).toMatchObject({
        resourceUri: 'ui://mf/cards/card',
        visibility: ['model', 'app'],
      });
      const resource = await client.readResource({ uri: 'ui://mf/cards/card' });
      expect(resource.contents[0]).toMatchObject({
        mimeType: 'text/html;profile=mcp-app',
        _meta: {
          ui: { csp: { resourceDomains: ['https://cdn.example.com'] } },
        },
      });
      const result = await client.callTool({ name: 'card' });
      expect(result.structuredContent).toMatchObject({
        message: 'hello',
        viewProps: { message: 'hello' },
      });
    } finally {
      await client.close();
    }
  });
  it('discovers and calls tools without initialize, with complete and cache metadata', async () => {
    const handle = createMcpHandler(definition);
    const discovery = await (await handle(request('server/discover'))).json();
    expect(discovery.error).toBeUndefined();
    expect(JSON.stringify(discovery.result)).toContain('2026-07-28');
    expect(discovery.result.resultType).toBe('complete');
    const listed = await (await handle(request('tools/list'))).json();
    expect(listed.result).toMatchObject({
      resultType: 'complete',
      ttlMs: 0,
      cacheScope: 'private',
    });
    expect(listed.result._meta['io.modelcontextprotocol/serverInfo'].name).toBe(
      'modern-mcp-apps',
    );
    const result = await (
      await handle(request('tools/call', { name: 'count' }))
    ).json();
    expect(result.result).toMatchObject({
      resultType: 'complete',
      structuredContent: [1, 2, 3],
    });
  });

  it('rejects mismatched or missing required metadata headers', async () => {
    const handle = createMcpHandler(definition);
    const mismatch = request('tools/call', { name: 'count' });
    mismatch.headers.set('mcp-name', 'another-tool');
    const response = await handle(mismatch);
    expect(response.status).toBe(400);
    expect((await response.json()).error.code).toBe(-32020);
    const missing = request('tools/list');
    missing.headers.delete('mcp-protocol-version');
    expect((await handle(missing)).status).toBe(400);
  });

  it('rejects untrusted browser origins and accepts explicitly allowed origins', async () => {
    const crossOrigin = () => {
      const req = request('tools/list');
      req.headers.set('origin', 'https://host.example.com');
      return req;
    };
    expect((await createMcpHandler(definition)(crossOrigin())).status).toBe(
      403,
    );
    expect(
      (
        await createMcpHandler(definition, {
          allowedOrigins: ['https://host.example.com'],
        })(crossOrigin())
      ).status,
    ).toBe(200);
  });

  it('preserves the modern envelope through BFF consumed-body reconstruction', async () => {
    const raw = request('tools/call', { name: 'count' });
    const data = await raw.json();
    const handle = createMcpBffHandler({ definition });
    const response = await handle({ data }, { req: { raw } });
    expect((await response.json()).result).toMatchObject({
      resultType: 'complete',
      structuredContent: [1, 2, 3],
    });
  });
});
