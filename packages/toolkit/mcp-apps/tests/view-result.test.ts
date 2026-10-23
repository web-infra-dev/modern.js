import { withViewProps } from '../src/server/index';
import { App } from '@modelcontextprotocol/ext-apps';
import { AppBridge } from '@modelcontextprotocol/ext-apps/app-bridge';
import { createMcpHandler, createMcpViewResult } from '../src/server/index';
import {
  MCP_VIEW_META_KEY,
  readMcpViewResult,
  mergeMcpViewProps,
  reduceMcpToolState,
} from '../src/ui/view-result';
import { bindUiResources, createUiManifest } from '../src/ui/resources';

const resource = { moduleFederation: { remoteName: 'remote' } };
const render = {
  version: 1,
  tool: 'test',
  resource,
  args: { value: 3 },
  viewProps: { value: 4 },
};
const result = { content: [], _meta: { [MCP_VIEW_META_KEY]: render } };

async function request(
  handle: ReturnType<typeof createMcpHandler>,
  method: string,
  params: object = {},
) {
  const response = await handle(
    new Request('http://localhost/mcp', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        accept: 'application/json, text/event-stream',
        'mcp-protocol-version': '2025-11-25',
      },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
    }),
  );
  return response.json();
}

it('preserves tool errors when the error reporter throws', async () => {
  const handle = createMcpHandler(
    {
      remotes: [],
      tools: [
        {
          name: 'fail',
          handler: () => {
            throw new Error('business failure');
          },
        },
      ],
    },
    {
      onError: () => {
        throw new Error('reporter failure');
      },
    },
  );
  const called = await request(handle, 'tools/call', {
    name: 'fail',
    arguments: {},
  });
  expect(called.result).toEqual({
    isError: true,
    content: [{ type: 'text', text: 'Tool execution failed' }],
  });
});

it('uses the public HTTPS origin in MF tool metadata behind a proxy', async () => {
  const handle = createMcpHandler({
    remotes: [
      { name: 'remote', baseUrl: 'https://example.com/mf-manifest.json' },
    ],
    tools: [{ name: 'view', remote: 'remote', view: { module: './View' } }],
  });
  const response = await handle(
    new Request('http://example.com/mcp', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        accept: 'application/json, text/event-stream',
        'x-forwarded-proto': 'https',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/call',
        params: { name: 'view', arguments: {} },
      }),
    }),
  );
  const body = await response.json();
  expect(
    body.result._meta[MCP_VIEW_META_KEY].resource.moduleFederation.mcpServerUrl,
  ).toBe('https://example.com');
});

describe('MCP rendering contract', () => {
  it('prefers versioned metadata over business fields and legacy output', () => {
    expect(
      readMcpViewResult({
        ...result,
        structuredContent: { args: { value: 99 } },
      }),
    ).toMatchObject(render);
    expect(mergeMcpViewProps({ value: 2 }, { value: 1 }, result)).toEqual({
      value: 4,
    });
  });

  it('reads old structured results and text payloads', () => {
    expect(
      readMcpViewResult({
        structuredContent: { args: { value: 3 }, viewProps: { value: 4 } },
      })?.viewProps,
    ).toEqual({ value: 4 });
    expect(
      readMcpViewResult({
        content: [
          { type: 'text', text: 'Human text' },
          {
            type: 'text',
            text: JSON.stringify({
              tool: 'test',
              config: { resource },
              args: {},
            }),
          },
        ],
      })?.resource,
    ).toEqual(resource);
  });

  it('does not reinterpret malformed or unsupported metadata as legacy data', () => {
    for (const value of [null, [], { version: 2 }, 'invalid']) {
      expect(
        readMcpViewResult({
          _meta: { [MCP_VIEW_META_KEY]: value },
          structuredContent: { args: {} },
        }),
      ).toBeUndefined();
    }
    expect(
      mergeMcpViewProps(undefined, undefined, {
        _meta: {
          [MCP_VIEW_META_KEY]: { version: 1, args: [], viewProps: 'text' },
        },
      }),
    ).toEqual({});
  });

  it('clears stale props on partial input, new input, cancellation and teardown', () => {
    const loaded = reduceMcpToolState(
      { cancelled: false },
      { type: 'result', result },
    );
    const partial = reduceMcpToolState(loaded, {
      type: 'partial',
      arguments: { value: 5 },
    });
    expect(partial.resource).toEqual(resource);
    expect(
      mergeMcpViewProps(partial.input, partial.partialInput, partial.result),
    ).toEqual({ value: 5 });
    const input = reduceMcpToolState(partial, {
      type: 'input',
      arguments: { value: 6 },
    });
    expect(input.partialInput).toBeUndefined();
    expect(input.result).toBeUndefined();
    const cancelled = reduceMcpToolState(input, { type: 'cancelled' });
    expect(cancelled).toEqual({ resource, cancelled: true });
    expect(
      reduceMcpToolState(cancelled, { type: 'input', arguments: {} }).cancelled,
    ).toBe(false);
    expect(reduceMcpToolState(cancelled, { type: 'teardown' })).toEqual({
      cancelled: false,
    });
  });

  it('preserves custom-server business data and unrelated metadata', () => {
    const business = {
      args: 'business args',
      resource: 'business resource',
      tool: 'business tool',
      viewProps: 'business props',
    };
    const output = createMcpViewResult(
      { id: 1 },
      {
        structuredContent: business,
        viewProps: { name: 'UI' },
        _meta: {
          trace: '123',
          [MCP_VIEW_META_KEY]: { version: 99, stale: true },
        },
      },
    );
    expect(output.structuredContent).toBe(business);
    expect(output._meta.trace).toBe('123');
    expect(readMcpViewResult(output)?.viewProps).toEqual({ name: 'UI' });
  });

  it('keeps output schemas visible for cards and validates business output', async () => {
    const handle = createMcpHandler({
      remotes: [],
      tools: [
        {
          name: 'test',
          view: { module: './View' },
          outputSchema: {
            type: 'object',
            properties: { args: { type: 'string' } },
            required: ['args'],
            additionalProperties: false,
          },
          handler: () => ({
            structuredContent: { args: 'business' },
            viewProps: { value: 4 },
            _meta: {
              trace: '123',
              [MCP_VIEW_META_KEY]: { version: 99, stale: true },
            },
          }),
        },
      ],
    });
    const listed = await request(handle, 'tools/list');
    expect(listed.result.tools[0].outputSchema.additionalProperties).toBe(
      false,
    );
    const called = await request(handle, 'tools/call', {
      name: 'test',
      arguments: {},
    });
    expect(called.result.structuredContent).toEqual({ args: 'business' });
    expect(called.result._meta.trace).toBe('123');
    expect(readMcpViewResult(called.result)?.viewProps).toEqual({ value: 4 });
    const invalid = createMcpHandler({
      remotes: [],
      tools: [
        {
          name: 'invalid',
          view: { module: './View' },
          outputSchema: {
            type: 'object',
            required: ['value'],
            properties: { value: { type: 'number' } },
          },
          handler: () => ({ structuredContent: { value: 'wrong' } }),
        },
      ],
    });
    expect(
      (await request(invalid, 'tools/call', { name: 'invalid' })).result
        .isError,
    ).toBe(true);
  });

  it('does not expose view-only rendering configuration as business output', async () => {
    const handle = createMcpHandler({
      remotes: [],
      tools: [{ name: 'test', view: { module: './View' } }],
    });
    const called = await request(handle, 'tools/call', {
      name: 'test',
      arguments: { value: 1 },
    });
    expect(called.result.structuredContent).toBeUndefined();
    expect(readMcpViewResult(called.result)?.args).toEqual({ value: 1 });
  });

  it('does not serialize view-only props into fallback text', async () => {
    const handle = createMcpHandler({
      remotes: [],
      tools: [
        {
          name: 'test',
          view: { module: './View' },
          handler: () => ({ viewProps: { uiData: 'card only' } }),
        },
      ],
    });
    const called = await request(handle, 'tools/call', { name: 'test' });
    expect(called.result.content).toEqual([
      { type: 'text', text: 'Tool test completed.' },
    ]);
    expect(called.result.structuredContent).toBeUndefined();
    expect(readMcpViewResult(called.result)?.viewProps).toEqual({
      uiData: 'card only',
    });
  });

  it('forwards metadata through the installed SDK host/app bridge', async () => {
    type Transport = NonNullable<Parameters<App['connect']>[0]>;
    const a: Transport = {
      start: async () => {},
      send: async message => {
        b.onmessage?.(structuredClone(message));
      },
      close: async () => {},
    };
    const b: Transport = {
      start: async () => {},
      send: async message => {
        a.onmessage?.(structuredClone(message));
      },
      close: async () => {},
    };
    const host = new AppBridge(null, { name: 'test host', version: '1' }, {});
    const app = new App(
      { name: 'test app', version: '1' },
      {},
      { autoResize: false },
    );
    const received = new Promise<unknown>(resolve => {
      app.ontoolresult = resolve;
    });
    try {
      await host.connect(a);
      await app.connect(b);
      await host.sendToolInput({ arguments: {} });
      await host.sendToolResult(result);
      expect(
        readMcpViewResult((await received) as typeof result)?.viewProps,
      ).toEqual({ value: 4 });
    } finally {
      await app.close();
      await host.close();
    }
  });

  it('rejects a manifest whose resource identity does not match the definition', () => {
    const definition = {
      remotes: [],
      tools: [{ name: 'test', view: { module: './View' } }],
    };
    const manifest = createUiManifest(definition);
    manifest.tools.test.resourceUri = 'ui://app/other';
    expect(() =>
      bindUiResources(definition, { directory: '/tmp/ui', manifest }),
    ).toThrow('MCP UI manifest mismatch');
  });
});

describe('withViewProps', () => {
  it('reuses business data while preserving the MCP result without mutation', () => {
    const data = { message: 'Hello' };
    const original = {
      content: [{ type: 'text' as const, text: 'Hello' }],
      structuredContent: data,
      _meta: { source: 'test' },
      isError: false,
    };
    const result = withViewProps(original);
    expect(result).toEqual({ ...original, viewProps: data });
    expect(result).not.toBe(original);
    expect(result.viewProps).toBe(data);
    expect(original).not.toHaveProperty('viewProps');
  });

  it('maps props without modifying business data', () => {
    const data = { orders: [{ id: '1' }], total: 1 };
    const result = withViewProps({ structuredContent: data }, value => ({
      items: value.orders,
      totalCount: value.total,
    }));
    expect(result.structuredContent).toBe(data);
    expect(result.viewProps).toEqual({ items: data.orders, totalCount: 1 });
  });

  it('propagates mapping failures', () => {
    const error = new Error('Mapping failed');
    expect(() =>
      withViewProps({ structuredContent: {} }, () => {
        throw error;
      }),
    ).toThrow(error);
  });
});
