import { it, expect, beforeAll, afterAll } from '@rstest/core';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { McpServer } from '@modelcontextprotocol/server';
import { Client } from '@modelcontextprotocol/client';
import { InMemoryTransport } from '@modelcontextprotocol/server';
import { registerUiResources } from '../src/server/resources';
import { validateUiManifest, type UiManifest } from '../src/manifest';

let directory: string;
beforeAll(async () => {
  directory = await mkdtemp(path.join(os.tmpdir(), 'modern-mcp-'));
  await mkdir(path.join(directory, 'ui'));
  await writeFile(
    path.join(directory, 'ui/card.html'),
    '<html><head></head><body>Hello</body></html>',
  );
});
afterAll(async () => {
  await rm(directory, { recursive: true, force: true });
});
const manifest = (): UiManifest => ({
  version: 1,
  assetBase: 'request',
  remotes: {
    app: { entry: 'static/mf-manifest.json', shell: './ui/card.html' },
  },
  views: {
    local: {
      html: './ui/card.html',
      ui: {
        prefersBorder: false,
        csp: { connectDomains: ['https://api.example'] },
        permissions: { clipboardWrite: {} },
      },
    },
    remote: { remote: 'app', expose: './Stats', ui: {} },
  },
});
async function connect(
  value: UiManifest | string | URL,
  options: Parameters<typeof registerUiResources>[1],
) {
  const server = new McpServer({ name: 'test', version: '1' });
  const filename = path.join(directory, `manifest-${crypto.randomUUID()}.json`);
  if (typeof value === 'object' && !(value instanceof URL))
    await writeFile(filename, JSON.stringify(value));
  const uris = await registerUiResources(server, {
    ...options,
    manifest:
      typeof value === 'string' || value instanceof URL ? value : filename,
  });
  const client = new Client({ name: 'test-client', version: '1' });
  const [a, b] = InMemoryTransport.createLinkedPair();
  await server.connect(a);
  await client.connect(b);
  return {
    uris,
    client,
    close: async () => {
      await client.close();
      await server.close();
    },
  };
}
it('resolves files relative to their manifest and keeps UI metadata', async () => {
  const filename = path.join(directory, 'ui-manifest.json');
  await writeFile(filename, JSON.stringify(manifest()));
  const session = await connect(filename, {
    request: new Request('https://app.example/api/mcp'),
  });
  try {
    expect(session.uris.local).toBe('ui://app/local');
    const result = await session.client.readResource({
      uri: session.uris.local,
    });
    expect(result.contents[0]).toMatchObject({
      mimeType: 'text/html;profile=mcp-app',
      text: expect.stringContaining('<base href="https://app.example/">'),
      _meta: {
        ui: {
          prefersBorder: false,
          permissions: { clipboardWrite: {} },
          csp: {
            connectDomains: ['https://api.example', 'https://app.example'],
          },
        },
      },
    });
  } finally {
    await session.close();
  }
});
it('injects fixed MF configuration in the resource, without a tool result', async () => {
  const session = await connect(manifest(), {
    assetBase: 'https://cdn.example/project',
  });
  try {
    const result = await session.client.readResource({
      uri: session.uris.remote,
    });
    const html = String(result.contents[0].text);
    expect(html).toContain(
      '"entry":"https://cdn.example/project/static/mf-manifest.json"',
    );
    expect(html).toContain('"expose":"./Stats"');
    expect(result.contents[0]._meta).toMatchObject({
      ui: {
        csp: {
          connectDomains: ['https://cdn.example'],
          resourceDomains: ['https://cdn.example'],
        },
      },
    });
  } finally {
    await session.close();
  }
});
it('supports independent absolute remote entries and request HTTPS termination', async () => {
  const value = manifest();
  value.remotes.app.entry = 'https://mf.example/mf-manifest.json';
  const session = await connect(value, {
    request: new Request('http://app.example/api/mcp', {
      headers: { 'x-forwarded-proto': 'https' },
    }),
  });
  try {
    const result = await session.client.readResource({
      uri: session.uris.remote,
    });
    expect(String(result.contents[0].text)).toContain(
      '<base href="https://app.example/">',
    );
    expect(result.contents[0]._meta).toMatchObject({
      ui: {
        csp: { connectDomains: ['https://app.example', 'https://mf.example'] },
      },
    });
  } finally {
    await session.close();
  }
});
it('rejects unsupported versions, missing remotes and path traversal', () => {
  expect(() => validateUiManifest({ ...manifest(), version: 2 })).toThrow(
    'version',
  );
  const value = manifest();
  value.remotes = {};
  expect(() => validateUiManifest(value)).toThrow('Invalid UI manifest view');
  value.views = { local: { html: '../secret', ui: {} } };
  expect(() => validateUiManifest(value)).toThrow('Invalid relative');
});

it('loads a hosted manifest and resolves relative HTML from its URL', async () => {
  const { createServer } = await import('node:http');
  const hosted: UiManifest = {
    version: 1,
    assetBase: 'https://cdn.example/assets/',
    remotes: {},
    views: { hosted: { html: './ui/card.html', ui: {} } },
  };
  const paths: string[] = [];
  const http = createServer((request, response) => {
    paths.push(request.url!);
    if (request.url === '/cards/ui-manifest.json')
      response.end(JSON.stringify(hosted));
    else if (request.url === '/cards/ui/card.html')
      response.end('<html><head></head><body>Hosted</body></html>');
    else response.writeHead(404).end();
  });
  await new Promise<void>(resolve => http.listen(0, '127.0.0.1', resolve));
  const address = http.address() as { port: number };
  try {
    const session = await connect(
      `http://127.0.0.1:${address.port}/cards/ui-manifest.json`,
      {},
    );
    try {
      const result = await session.client.readResource({
        uri: session.uris.hosted,
      });
      expect(result.contents[0].text).toContain(
        '<base href="https://cdn.example/assets/">',
      );
      expect(paths).toEqual(['/cards/ui-manifest.json', '/cards/ui/card.html']);
    } finally {
      await session.close();
    }
  } finally {
    http.closeAllConnections();
    await new Promise<void>((resolve, reject) =>
      http.close(error => (error ? reject(error) : resolve())),
    );
  }
});

it('rejects missing or invalid manifests during resource registration', async () => {
  const server = new McpServer({ name: 'test', version: '1' });
  await expect(
    registerUiResources(server, {
      manifest: path.join(directory, 'missing.json'),
    }),
  ).rejects.toThrow('ENOENT');
  const filename = path.join(directory, 'invalid.json');
  await writeFile(filename, JSON.stringify({ ...manifest(), version: 2 }));
  await expect(
    registerUiResources(server, { manifest: filename }),
  ).rejects.toThrow('version');
});

it('keeps request origins isolated when servers share a cached manifest', async () => {
  const filename = path.join(directory, 'shared-origins.json');
  await writeFile(filename, JSON.stringify(manifest()));
  const first = await connect(filename, {
    request: new Request('https://first.example/api/mcp'),
  });
  const second = await connect(filename, {
    request: new Request('https://second.example/api/mcp'),
  });
  try {
    for (const [session, origin] of [
      [first, 'https://first.example'],
      [second, 'https://second.example'],
    ] as const) {
      const resource = await session.client.readResource({
        uri: session.uris.remote,
      });
      expect(String(resource.contents[0].text)).toContain(
        `<base href="${origin}/">`,
      );
      expect(String(resource.contents[0].text)).toContain(
        `"entry":"${origin}/static/mf-manifest.json"`,
      );
    }
  } finally {
    await first.close();
    await second.close();
  }
});

it.each([
  [
    'development',
    'http://app.example:8088/api/mcp',
    {},
    'ws://app.example:8088',
  ],
  [
    'development',
    'http://app.example/api/mcp',
    { 'x-forwarded-proto': 'https' },
    'wss://app.example',
  ],
  ['production', 'https://app.example/api/mcp', {}, undefined],
])(
  'limits automatic HMR WebSocket permissions to development',
  async (mode, url, headers, expected) => {
    const previous = process.env.NODE_ENV;
    process.env.NODE_ENV = mode;
    try {
      const session = await connect(manifest(), {
        request: new Request(url, { headers }),
      });
      try {
        const resource = await session.client.readResource({
          uri: session.uris.local,
        });
        const domains = (
          resource.contents[0]._meta as {
            ui: { csp: { connectDomains: string[] } };
          }
        ).ui.csp.connectDomains;
        if (expected) expect(domains).toContain(expected);
        else expect(domains.some(domain => /^wss?:/.test(domain))).toBe(false);
      } finally {
        await session.close();
      }
    } finally {
      if (previous === undefined) delete process.env.NODE_ENV;
      else process.env.NODE_ENV = previous;
    }
  },
);
