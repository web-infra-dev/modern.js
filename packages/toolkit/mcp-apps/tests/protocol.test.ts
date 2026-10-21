import { createServer } from 'node:http';
import { mcpApps } from '../src/hono';
import {
  Client,
  StreamableHTTPClientTransport,
} from '@modelcontextprotocol/client';
import { createArtifactHandler, createMcpHandler } from '../src/server';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { MCP_VIEW_META_KEY } from '../src/view-result';
import {
  createUiResources,
  normalizeToolConfig,
  bindUiResources,
  createUiManifest,
} from '../src/resources';

describe('MCP Apps interoperability', () => {
  it('embeds MF capabilities before the handshake without allowing HTML injection', async () => {
    const capabilities = {
      tools: { listChanged: true },
      experimental: { 'example.test': { value: '</script>' } },
    };
    const handle = createMcpHandler(
      {
        remotes: [
          {
            name: 'remote',
            baseUrl: 'https://example.com/mf-manifest.json',
            capabilities,
          },
        ],
        tools: [{ name: 'view', remote: 'remote', view: { module: './View' } }],
      },
      {
        resourceHtml: '<!doctype html><html><head></head><body></body></html>',
      },
    );
    const response = await handle(
      new Request('http://localhost/mcp', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          accept: 'application/json, text/event-stream',
          'mcp-protocol-version': '2025-11-25',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'resources/read',
          params: { uri: 'ui://mf/remote/view' },
        }),
      }),
    );
    const body = await response.json();
    const html = body.result.contents[0].text;
    const json = html.match(
      /id="modern-mcp-capabilities">(.*?)<\/script>/,
    )?.[1];
    expect(JSON.parse(json)).toEqual(capabilities);
    expect(json).not.toContain('</script>');
  });
  for (const mf of [false, true]) {
    for (const ui of [false, true]) {
      it(`${mf ? 'MF' : 'local'} negotiates UI support: ${ui}`, async () => {
        const handle = createMcpHandler({
          name: 'test',
          version: '1',
          remotes: mf
            ? [
                {
                  name: 'remote',
                  baseUrl: 'https://example.com/mf-manifest.json',
                },
              ]
            : [],
          tools: [
            {
              name: 'greet',
              inputSchema: { type: 'object' },
              handler: () => ({
                structuredContent: { message: 'Hello' },
                viewProps: { message: 'Hello' },
              }),
              ...(mf ? { remote: 'remote' } : {}),
              view: { module: './Greeting' },
            },
          ],
        });
        const client = new Client(
          { name: 'test', version: '1' },
          {
            versionNegotiation: { mode: 'auto' },
            capabilities: ui
              ? {
                  extensions: {
                    'io.modelcontextprotocol/ui': {
                      mimeTypes: ['text/html;profile=mcp-app'],
                    },
                  },
                }
              : {},
          },
        );
        await client.connect(
          new StreamableHTTPClientTransport(new URL('http://localhost/mcp'), {
            fetch: async (input, init) => handle(new Request(input, init)),
          }),
        );
        try {
          const listed = await client.listTools();
          expect(listed.tools[0]._meta?.ui).toEqual({
            ...(ui
              ? {
                  resourceUri: mf ? 'ui://mf/remote/greet' : 'ui://local/greet',
                }
              : {}),
            visibility: ['model', 'app'],
          });
          expect(listed.tools[0]._meta).not.toHaveProperty(
            'openai/outputTemplate',
          );
          const result = await client.callTool({
            name: 'greet',
            arguments: {},
          });
          expect(result.content).toEqual([
            { type: 'text', text: '{"message":"Hello"}' },
          ]);
          expect(result.structuredContent).toEqual({ message: 'Hello' });
          expect(result._meta?.[MCP_VIEW_META_KEY]).toMatchObject({
            version: 1,
            viewProps: { message: 'Hello' },
          });
        } finally {
          await client.close();
        }
      });
    }
  }

  it('binds full local resource metadata and normalizes defaults', () => {
    const tool = normalizeToolConfig(
      { name: 'test', view: { module: './View' } },
      {
        permissions: { camera: {} },
        domain: 'example.test',
        prefersBorder: false,
      },
    );
    const { resources } = createUiResources({ remotes: [], tools: [tool] });
    expect(resources.get('ui://local/test')?._meta.ui).toMatchObject({
      permissions: { camera: {} },
      domain: 'example.test',
      prefersBorder: false,
    });
  });
});

function request(origin = 'http://example.com', forwardedProto = 'http') {
  return new Request('http://example.com/mcp', {
    method: 'POST',
    headers: {
      origin,
      'x-forwarded-proto': forwardedProto,
      'content-type': 'application/json',
      accept: 'application/json, text/event-stream',
    },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/list' }),
  });
}

it('accepts the public HTTPS origin behind a proxy and rejects other origins', async () => {
  const handle = createMcpHandler({
    remotes: [],
    tools: [{ name: 'greet', handler: () => ({ content: [] }) }],
  });
  expect((await handle(request('https://example.com', 'https'))).status).toBe(
    200,
  );
  expect((await handle(request())).status).toBe(200);
  expect((await handle(request('https://evil.example', 'https'))).status).toBe(
    403,
  );
});

it('binds copied HTML and its asset base from the production manifest', () => {
  const definition = {
    remotes: [],
    tools: [
      {
        name: 'greet',
        view: { module: './Greeting.tsx', html: './cards/greet.html' },
      },
    ],
  };
  const manifest = createUiManifest(
    {
      ...definition,
      tools: [{ name: 'greet', view: { module: './Greeting.tsx' } }],
    },
    { assetBase: 'https://cdn.example.com/' },
  );
  const directory = path.resolve('/deploy/dist/mcp-apps/ui');
  const bound = bindUiResources(definition, { directory, manifest });
  expect(bound.tools[0].view?.html).toBe(
    path.resolve(directory, '..', manifest.tools.greet.html),
  );
  expect(bound.tools[0].view?.assetBase).toBe('https://cdn.example.com/');
  expect(definition.tools[0].view.html).toBe('./cards/greet.html');
  expect(bindUiResources(definition, { directory }).tools[0].view?.html).toBe(
    './cards/greet.html',
  );
  const remoteHtml = {
    ...definition,
    tools: [
      {
        name: 'greet',
        view: {
          module: './Greeting.tsx',
          html: 'https://cdn.example.com/greet.html',
        },
      },
    ],
  };
  expect(
    bindUiResources(remoteHtml, { directory, manifest }).tools[0].view?.html,
  ).toBe('https://cdn.example.com/greet.html');
});

it('binds the public asset base to explicit development HTML resources', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'modern-mcp-html-'));
  try {
    await writeFile(
      path.join(directory, 'card.html'),
      '<html><head></head><body><script src="./card.js"></script></body></html>',
    );
    const definition = {
      remotes: [],
      tools: [
        { name: 'card', view: { module: './Card.tsx', html: './card.html' } },
      ],
    };
    const bound = bindUiResources(definition, {
      directory: path.join(directory, 'ui'),
      assetBase: 'https://assets.example.com/app/',
    });
    expect(bound.tools[0].view?.html).toBe('./card.html');
    expect(definition.tools[0].view).not.toHaveProperty('assetBase');
    const handle = createMcpHandler(bound, {
      configPath: path.join(directory, 'mcp_apps.ts'),
      development: true,
    });
    const response = await handle(
      new Request('http://example.com/mcp', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          accept: 'application/json, text/event-stream',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'resources/read',
          params: { uri: 'ui://local/card' },
        }),
      }),
    );
    const { result } = await response.json();
    expect(result.contents[0].text).toContain(
      '<base href="https://assets.example.com/app/">',
    );
    for (const key of ['resourceDomains', 'connectDomains', 'baseUriDomains']) {
      expect(result.contents[0]._meta.ui.csp[key]).toContain(
        'https://assets.example.com',
      );
    }
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

it('preserves HTTPS HTML and asset base override precedence', () => {
  const definition = {
    remotes: [],
    viewDefaults: { assetBase: 'https://defaults.example.com/' },
    tools: [
      {
        name: 'card',
        view: {
          module: './Card.tsx',
          html: 'https://html.example.com/card.html',
        },
      },
    ],
  };
  const options = {
    directory: '/unused',
    assetBase: 'https://fallback.example.com/',
  };
  const bound = bindUiResources(definition, options);
  expect(bound.tools[0].view).toMatchObject({
    html: 'https://html.example.com/card.html',
    assetBase: 'https://defaults.example.com/',
  });
  expect(
    bindUiResources(
      {
        ...definition,
        tools: [
          {
            ...definition.tools[0],
            view: {
              ...definition.tools[0].view,
              assetBase: 'https://override.example.com/',
            },
          },
        ],
      },
      options,
    ).tools[0].view?.assetBase,
  ).toBe('https://override.example.com/');
});

it('reloads changed CommonJS definitions in development', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'modern-mcp-reload-'));
  const entry = path.join(directory, 'mcp_apps.cjs');
  const writeDefinition = (name: string) =>
    writeFile(
      entry,
      `module.exports = { remotes: [], tools: [{ name: ${JSON.stringify(name)}, handler: () => ({ content: [] }) }] }`,
    );
  const handler = createArtifactHandler(entry, { development: true });
  try {
    await writeDefinition('before');
    const before = await handler.handle(request());
    expect((await before.json()).result.tools[0].name).toBe('before');
    await writeDefinition('after');
    const after = await handler.handle(request());
    expect((await after.json()).result.tools[0].name).toBe('after');
  } finally {
    handler.reset();
    await rm(directory, { recursive: true, force: true });
  }
});

function toolRequest() {
  return new Request('http://example.com/mcp', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      accept: 'application/json, text/event-stream',
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/call',
      params: { name: 'test', arguments: {} },
    }),
  });
}

it('preserves all fetchJson header formats and explicit content types', async () => {
  const server = createServer((req, res) => {
    req.resume();
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify(req.headers));
  });
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  const address = server.address() as { port: number };
  try {
    for (const headers of [
      { Authorization: 'Bearer test' },
      new Headers({ Authorization: 'Bearer test' }),
      [['Authorization', 'Bearer test']] as [string, string][],
      new Headers({
        Authorization: 'Bearer test',
        'Content-Type': 'application/custom',
      }),
    ]) {
      const handle = createMcpHandler({
        remotes: [],
        tools: [
          {
            name: 'test',
            handler: async (_args, ctx) => ({
              content: [],
              structuredContent: await ctx.fetchJson(
                `http://127.0.0.1:${address.port}`,
                {
                  method: 'POST',
                  headers,
                  body: { value: 1 },
                },
              ),
            }),
          },
        ],
      });
      const result = (await (await handle(toolRequest())).json()).result;
      expect(result.isError).not.toBe(true);
      expect(result.structuredContent.authorization).toBe('Bearer test');
      expect(result.structuredContent['content-type']).toBe(
        new Headers(headers).get('content-type') ?? 'application/json',
      );
    }
  } finally {
    await new Promise<void>((resolve, reject) =>
      server.close(error => (error ? reject(error) : resolve())),
    );
  }
});

it('reports tool errors through both Hono definition and artifact adapters', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'modern-mcp-hono-'));
  const configPath = path.join(directory, 'mcp_apps.cjs');
  await writeFile(
    configPath,
    `module.exports = { remotes: [], tools: [{ name: 'test', handler: () => { throw new Error('tool failed') } }] }`,
  );
  try {
    for (const source of [
      {
        definition: {
          remotes: [],
          tools: [
            {
              name: 'test',
              handler: () => {
                throw new Error('tool failed');
              },
            },
          ],
        },
      },
      { configPath },
    ]) {
      const errors: unknown[] = [];
      const middleware = mcpApps({
        ...source,
        onError: error => errors.push(error),
      });
      const response = await middleware(
        { req: { raw: toolRequest(), path: '/mcp' } },
        async () => {},
      );
      expect(response).toBeInstanceOf(Response);
      expect((await response!.json()).result.isError).toBe(true);
      expect(errors).toHaveLength(1);
      expect((errors[0] as Error).message).toBe('tool failed');
    }
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
