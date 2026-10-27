import { it, expect, rs, afterEach } from '@rstest/core';
import { McpServer } from '@modelcontextprotocol/server';
import { z } from 'zod';
import {
  registerUiResources,
  createFetchHandler,
  createBffHandlers,
} from '../src/server';

const { requestContext, contextStorage } = rs.hoisted(() => {
  const { AsyncLocalStorage } = require('node:async_hooks');
  return {
    requestContext: { raw: undefined as Request | undefined },
    contextStorage: new AsyncLocalStorage(),
  };
});
rs.mock('@modern-js/server-runtime', () => ({
  useHonoContext: () => ({
    req: { raw: contextStorage.getStore()?.raw ?? requestContext.raw },
    get: () => ({ modernMcpApps: contextStorage.getStore()?.uiOptions }),
  }),
}));
const factory = () => {
  const server = new McpServer({ name: 'test', version: '1' });
  server.registerTool(
    'echo',
    { inputSchema: z.object({ text: z.string() }) },
    async ({ text }) => ({
      content: [{ type: 'text', text }],
      structuredContent: { text },
    }),
  );
  return server;
};
const headers = {
  'content-type': 'application/json',
  accept: 'application/json, text/event-stream',
};
async function responseResult(response: Response) {
  const text = await response.text();
  return JSON.parse(
    text.startsWith('event:')
      ? text
          .split('\n')
          .find(line => line.startsWith('data:'))!
          .slice(5)
      : text,
  );
}
it('serves official tools and validation through the SDK stateless transport', async () => {
  const handle = createFetchHandler(factory);
  const request = (args: unknown) =>
    new Request('https://app.example/api/mcp', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/call',
        params: { name: 'echo', arguments: args },
      }),
    });
  const success = await responseResult(
    await handle(request({ text: 'hello' })),
  );
  expect(success.result.structuredContent).toEqual({ text: 'hello' });
  const invalid = await responseResult(await handle(request({ text: 1 })));
  expect(invalid.result?.isError || invalid.error).toBeTruthy();
  expect(
    (await handle(new Request('https://app.example/api/mcp'))).status,
  ).toBe(405);
});
it('rejects foreign origins before constructing a server', async () => {
  const create = rs.fn(factory);
  const handle = createFetchHandler(create);
  expect(
    (
      await handle(
        new Request('https://app.example/api/mcp', {
          method: 'POST',
          headers: { ...headers, origin: 'https://foreign.example' },
          body: '{}',
        }),
      )
    ).status,
  ).toBe(403);
  expect(create).not.toHaveBeenCalled();
});
it('reconstructs a consumed BFF JSON body and returns the transport Response directly', async () => {
  const data = {
    jsonrpc: '2.0',
    id: 1,
    method: 'tools/call',
    params: { name: 'echo', arguments: { text: 'from BFF' } },
  };
  const raw = new Request('https://app.example/api/mcp', {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
  });
  await raw.json();
  requestContext.raw = raw;
  const { POST } = createBffHandlers(factory);
  const response = await POST({ data });
  expect((await responseResult(response)).result.structuredContent).toEqual({
    text: 'from BFF',
  });
});

afterEach(() => rs.restoreAllMocks());

it('resolves injected options from BFF requests and isolates concurrent requests', async () => {
  rs.spyOn(globalThis, 'fetch').mockImplementation(async input => {
    const name = new URL(String(input)).pathname.slice(1);
    return Response.json({
      version: 1,
      assetBase: 'https://assets.example/',
      remotes: {},
      views: { [name]: { html: './card.html', ui: {} } },
    });
  });
  const seen: Record<string, string>[] = [];
  const errors: string[] = [];
  const { POST } = createBffHandlers(
    async request => {
      const server = factory();
      // Force both requests to overlap before resolving their configuration.
      await Promise.resolve();
      seen.push(await registerUiResources(server, { request }));
      const override = await registerUiResources(server, {
        request,
        manifest: 'https://assets.example/explicit',
        mode: 'production',
      });
      expect(override).toEqual({ explicit: 'ui://app/explicit' });
      return server;
    },
    {
      onError: error => {
        errors.push(error.message);
      },
    },
  );
  const send = async (name: string) => {
    const raw = new Request('https://app.example/api/mcp', {
      method: 'POST',
      headers,
    });
    const uiOptions = {
      manifest: `https://assets.example/${name}`,
      mode: 'development',
    };
    return contextStorage.run({ raw, uiOptions }, () =>
      POST({ data: { jsonrpc: '2.0', id: 1, method: 'tools/list' } }),
    );
  };
  const responses = await Promise.all([send('first'), send('second')]);
  expect(errors).toEqual([]);
  expect(responses.map(response => response.status)).toEqual([200, 200]);
  expect(seen).toContainEqual({ first: 'ui://app/first' });
  expect(seen).toContainEqual({ second: 'ui://app/second' });
});
