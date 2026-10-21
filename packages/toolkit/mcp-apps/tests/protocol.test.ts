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
