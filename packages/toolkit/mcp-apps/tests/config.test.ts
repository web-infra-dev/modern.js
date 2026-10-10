import { expect, it } from '@rstest/core';
import { defineMcpServer, defineTool } from '../src/config';
import { createMcpHandler } from '../src/server';

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
  const tool = defineTool({
    name: 'greet',
    inputSchema: {
      type: 'object',
      properties: { name: { type: 'string', minLength: 1 } },
      required: ['name'],
      additionalProperties: false,
    },
    _meta: { 'openai/toolInvocation/invoking': 'Greeting' },
    handler: async ({ name }) => {
      await Promise.resolve();
      calls++;
      return { structuredContent: { message: name.toUpperCase() } };
    },
  });
  const config = defineMcpServer({
    name: 'typed-server',
    version: '2.0.0',
    tools: [tool],
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
  const listed = await (await handle(rpc('tools/list'))).json();
  expect(listed.result.tools[0]._meta['openai/toolInvocation/invoking']).toBe(
    'Greeting',
  );
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
  expect(result.result.serverInfo).toEqual({ name: 'override', version: '2' });
});

it('rejects empty server identity before mounting an endpoint', () => {
  expect(() => defineMcpServer({ name: ' ', version: '1', tools: [] })).toThrow(
    'MCP server name and version must be non-empty',
  );
});
