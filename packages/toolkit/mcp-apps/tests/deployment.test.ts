import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createArtifactHandler, createMcpHandler } from '../src/server';
import { bindUiResources, createUiManifest } from '../src/resources';

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
