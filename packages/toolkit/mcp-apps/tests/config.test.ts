import * as configEntry from '../src/config';
import { expect, it, describe } from '@rstest/core';
import { defineMcpServer } from '../src/config';
import { createMcpHandler } from '../src/server';
import { normalizeToolConfig } from '../src/resources';
import { normalizeInputSchema } from '../src/resources';
import { bindUiResources } from '../src/resources';

describe('config', () => {
  function rpc(method: string, params: unknown = {}) {
    return new Request('http://localhost/mcp', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        accept: 'application/json, text/event-stream',
      },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
    });
  }

  it('uses definition identity and awaits a typed non-view tool without remotes', async () => {
    let calls = 0;
    const config = defineMcpServer({
      name: 'typed-server',
      version: '2.0.0',
      tools: [
        {
          name: 'greet',
          inputSchema: {
            name: { type: 'string', minLength: 1 },
          },
          _meta: { 'openai/toolInvocation/invoking': 'Greeting' },
          handler: async ({ name }) => {
            await Promise.resolve();
            calls++;
            return { structuredContent: { message: name.toUpperCase() } };
          },
        },
      ],
    });
    const handle = createMcpHandler(config);
    const initialized = await (
      await handle(
        rpc('initialize', {
          protocolVersion: '2025-11-25',
          capabilities: {},
          clientInfo: { name: 'test', version: '1' },
        }),
      )
    ).json();
    expect(initialized.result.serverInfo).toEqual({
      name: 'typed-server',
      version: '2.0.0',
    });
    expect(config.remotes).toEqual([]);
    const shorthand = config.tools[0].inputSchema;
    expect(shorthand).toEqual({ name: { type: 'string', minLength: 1 } });
    const listed = await (await handle(rpc('tools/list'))).json();
    expect(listed.result.tools[0]._meta['openai/toolInvocation/invoking']).toBe(
      'Greeting',
    );
    expect(listed.result.tools[0].inputSchema).toEqual({
      type: 'object',
      properties: { name: { type: 'string', minLength: 1 } },
      required: ['name'],
      additionalProperties: false,
    });
    const resources = await (await handle(rpc('resources/list'))).json();
    expect(resources.result.resources).toEqual([]);
    const valid = await (
      await handle(
        rpc('tools/call', {
          name: 'greet',
          arguments: { name: 'Ada' },
        }),
      )
    ).json();
    expect(valid.result.structuredContent).toEqual({ message: 'ADA' });
    const invalid = await (
      await handle(
        rpc('tools/call', {
          name: 'greet',
          arguments: { name: 42 },
        }),
      )
    ).json();
    expect(invalid.result.isError).toBe(true);
    for (const args of [{}, { name: '' }, { name: 'Ada', extra: true }]) {
      const rejected = await (
        await handle(rpc('tools/call', { name: 'greet', arguments: args }))
      ).json();
      expect(rejected.result.isError).toBe(true);
    }
    expect(calls).toBe(1);
  });

  it('lets endpoint identity override definition identity', async () => {
    const handle = createMcpHandler(
      defineMcpServer({
        name: 'original',
        version: '1',
        tools: [{ name: 'empty', handler: () => ({ content: [] }) }],
      }),
      { serverInfo: { name: 'override', version: '2' } },
    );
    const result = await (
      await handle(
        rpc('initialize', {
          protocolVersion: '2025-11-25',
          capabilities: {},
          clientInfo: { name: 'test', version: '1' },
        }),
      )
    ).json();
    expect(result.result.serverInfo).toEqual({
      name: 'override',
      version: '2',
    });
  });

  it('rejects empty server identity before mounting an endpoint', () => {
    expect(() =>
      defineMcpServer({ name: ' ', version: '1', tools: [] }),
    ).toThrow('MCP server name and version must be non-empty');
  });

  it('validates optional shorthand properties before executing handlers', async () => {
    const handle = createMcpHandler(
      defineMcpServer({
        name: 'optional',
        version: '1',
        tools: [
          {
            name: 'greet',
            inputSchema: {
              name: { type: 'string' },
              count: { type: 'integer', minimum: 1, optional: true },
            },
            handler: ({ name, count }) => ({
              structuredContent: { name, count: count ?? 1 },
            }),
          },
        ],
      }),
    );
    for (const args of [{ name: 'Ada' }, { name: 'Ada', count: 2 }]) {
      const result = await (
        await handle(rpc('tools/call', { name: 'greet', arguments: args }))
      ).json();
      expect(result.result.structuredContent).toEqual({
        name: 'Ada',
        count: 'count' in args ? args.count : 1,
      });
    }
    const invalid = await (
      await handle(
        rpc('tools/call', {
          name: 'greet',
          arguments: { name: 'Ada', count: 0 },
        }),
      )
    ).json();
    expect(invalid.result.isError).toBe(true);
  });
});

describe('input-schema', () => {
  it('preserves full JSON Schema definitions, including schemas without type', () => {
    for (const schema of [
      {},
      { properties: { name: { type: 'string' } } },
      { $defs: { name: { type: 'string' } }, $ref: '#/$defs/name' },
      { anyOf: [{ type: 'string' }, { type: 'number' }] },
      { type: 'object', properties: { type: { type: 'string' } } },
    ]) {
      expect(normalizeInputSchema(schema)).toBe(schema);
    }
  });

  it('normalizes shorthand without mutating fields or nested constraints', () => {
    const address = Object.freeze({
      type: 'object',
      properties: { city: { type: 'string' } },
      required: ['city'],
      additionalProperties: false,
    });
    const count = Object.freeze({
      type: 'integer',
      minimum: 1,
      optional: true,
    });
    const schema = Object.freeze({ address, count });
    const tool = Object.freeze({ name: 'test', inputSchema: schema });
    const normalized = normalizeToolConfig(tool).inputSchema;
    expect(normalized).toEqual({
      type: 'object',
      properties: { address, count: { type: 'integer', minimum: 1 } },
      required: ['address'],
      additionalProperties: false,
    });
    expect(normalizeInputSchema(normalized)).toBe(normalized);
    expect(schema.count.optional).toBe(true);
  });

  it('rejects malformed optional markers and unsupported field constraints at setup', () => {
    const server = (inputSchema: Record<string, unknown>) => ({
      name: 'test',
      version: '1',
      remotes: [],
      tools: [{ name: 'test', inputSchema, handler: () => ({ content: [] }) }],
    });
    expect(() =>
      createMcpHandler(server({ count: { type: 'integer', optional: 'yes' } })),
    ).toThrow('optional must be a boolean');
    expect(() =>
      createMcpHandler(
        server({ count: { type: 'integer', typoKeyword: true } }),
      ),
    ).toThrow('unknown keyword');
  });
});

describe('view-defaults', () => {
  it('inherits defaults and replaces CSP lists explicitly without mutating input', () => {
    const defaults = {
      assetBase: 'https://cdn.example',
      exportName: 'default',
      csp: {
        resourceDomains: ['https://cdn.example'],
        connectDomains: ['https://api.example'],
      },
    };
    const tool = {
      name: 'card',
      view: { module: './Card', csp: { connectDomains: [] } },
    };
    const result = normalizeToolConfig(tool, defaults);
    expect(result.view?.assetBase).toBe('https://cdn.example');
    expect(result.view?.csp).toEqual({
      resourceDomains: ['https://cdn.example'],
      connectDomains: [],
    });
    expect(tool.view).toEqual({
      module: './Card',
      csp: { connectDomains: [] },
    });
    expect(
      normalizeToolConfig({ name: 'headless' }, defaults).view,
    ).toBeUndefined();
  });
  it('prioritizes tool and application asset bases over runtime binding defaults', () => {
    const definition = {
      remotes: [],
      viewDefaults: { assetBase: 'https://app.example' },
      tools: [
        { name: 'one', view: { module: './One' } },
        {
          name: 'two',
          view: { module: './Two', assetBase: 'https://tool.example' },
        },
      ],
    };
    const bound = bindUiResources(definition, {
      directory: '/ui',
      assetBase: 'request',
    });
    expect(bound.tools.map(tool => tool.view?.assetBase)).toEqual([
      'https://app.example',
      'https://tool.example',
    ]);
  });
});

it('keeps the configuration entry limited to definition helpers', () => {
  expect(Object.keys(configEntry).sort()).toEqual([
    'defineMcpApps',
    'defineMcpServer',
    'defineMcpUi',
    'defineTool',
  ]);
});
