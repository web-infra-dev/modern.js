import {
  Client,
  StreamableHTTPClientTransport,
} from '@modelcontextprotocol/client';
import { createMcpHandler } from '../src/server';
import { MCP_VIEW_META_KEY } from '../src/view-result';
import { createUiResources, normalizeToolConfig } from '../src/resources';
import {
  startInspectorSandbox,
  sandboxCsp,
} from '../src/inspector/sandbox-server';
import {
  appTools,
  assertAppTool,
  readHtmlResource,
  disposeBridge,
  disposePreview,
  externalUrl,
  downloadName,
} from '../src/inspector/protocol';
import type { AppBridge } from '@modelcontextprotocol/ext-apps/app-bridge';

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

  it('enforces app visibility in both discovery and calls', () => {
    const tools = [
      { name: 'default' },
      { name: 'app', _meta: { ui: { visibility: ['app'] as const } } },
      { name: 'model', _meta: { ui: { visibility: ['model'] as const } } },
    ];
    const input = tools as unknown as Parameters<typeof appTools>[0];
    expect(appTools(input).map(tool => tool.name)).toEqual(['default', 'app']);
    expect(() => assertAppTool(input, 'model')).toThrow();
    expect(() => assertAppTool(input, 'missing')).toThrow();
  });

  it('accepts UTF-8 blob HTML and prefers content metadata over listing metadata', () => {
    const html = '<!doctype html><html>你好</html>';
    const content = {
      uri: 'ui://test',
      mimeType: 'text/html;profile=mcp-app',
      blob: Buffer.from(html).toString('base64'),
      _meta: { ui: { prefersBorder: false } },
    };
    expect(
      readHtmlResource([content], content.uri, { prefersBorder: true }),
    ).toEqual({ html, ui: { prefersBorder: false } });
    expect(() =>
      readHtmlResource([{ ...content, mimeType: 'text/plain' }], content.uri),
    ).toThrow();
  });

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

  it('tears down before closing even when graceful shutdown fails', async () => {
    const calls: string[] = [];
    await expect(
      disposeBridge({
        getAppCapabilities: () => ({}),
        teardownResource: async () => {
          calls.push('teardown');
          throw new Error('timeout');
        },
        close: async () => {
          calls.push('close');
        },
      } as unknown as AppBridge),
    ).rejects.toThrow('timeout');
    expect(calls).toEqual(['teardown', 'close']);
  });

  it('keeps the preview mounted until asynchronous teardown and close finish', async () => {
    const calls: string[] = [];
    let finishSave!: () => void;
    let finishClose!: () => void;
    const save = new Promise<void>(resolve => {
      finishSave = resolve;
    });
    const closed = new Promise<void>(resolve => {
      finishClose = resolve;
    });
    let closing!: () => void;
    const closingStarted = new Promise<void>(resolve => {
      closing = resolve;
    });
    const pending = disposePreview(
      {
        getAppCapabilities: () => ({}),
        teardownResource: async () => {
          calls.push('saving');
          await save;
          calls.push('saved');
        },
        close: async () => {
          calls.push('closing');
          closing();
          await closed;
        },
      } as unknown as AppBridge,
      () => calls.push('clear iframe'),
    );
    expect(calls).toEqual(['saving']);
    finishSave();
    await closingStarted;
    expect(calls).toEqual(['saving', 'saved', 'closing']);
    finishClose();
    await pending;
    expect(calls).toEqual(['saving', 'saved', 'closing', 'clear iframe']);
  });

  it('clears the preview after closing when teardown fails', async () => {
    const calls: string[] = [];
    await disposePreview(
      {
        getAppCapabilities: () => ({}),
        teardownResource: async () => {
          throw new Error('timeout');
        },
        close: async () => {
          calls.push('close');
        },
      } as unknown as AppBridge,
      () => calls.push('clear iframe'),
    );
    expect(calls).toEqual(['close', 'clear iframe']);
  });

  it('rejects unsafe URLs and sanitizes downloaded filenames', () => {
    expect(() => externalUrl('javascript:alert(1)')).toThrow();
    expect(downloadName('file:///report%2Fsecret.txt')).toBe(
      'report_secret.txt',
    );
  });
});

describe('sandbox isolation', () => {
  it('rejects CSP directive injection and blocks undeclared connections', () => {
    expect(sandboxCsp()).toContain("connect-src 'none'");
    expect(sandboxCsp()).toContain("frame-src 'none'");
    expect(() =>
      sandboxCsp({ resourceDomains: ['https://example.com; connect-src *'] }),
    ).toThrow();
  });

  it('serves raw HTML with CSP headers on a separate origin', async () => {
    const sandbox = await startInspectorSandbox();
    try {
      const origin = new URL(sandbox.url).origin;
      const proxy = await fetch(
        `${sandbox.url}?parentOrigin=http://localhost:8080`,
      );
      expect(proxy.headers.get('content-security-policy')).toContain(
        'frame-ancestors http://localhost:8080',
      );
      const upload = await fetch(`${sandbox.url}/resource`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', origin },
        body: JSON.stringify({
          html: '<!doctype html><html>hello</html>',
          csp: { resourceDomains: ['https://cdn.example.com'] },
        }),
      });
      expect(upload.status).toBe(200);
      const { url } = await upload.json();
      const resource = await fetch(new URL(url, sandbox.url));
      expect(resource.headers.get('content-security-policy')).toContain(
        'https://cdn.example.com',
      );
      expect(resource.headers.get('content-security-policy')).toContain(
        "object-src 'none'",
      );
      expect(await resource.text()).toContain('hello');
      const denied = await fetch(`${sandbox.url}/resource`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          origin: 'http://evil.test',
        },
        body: '{}',
      });
      expect(denied.status).toBe(403);
    } finally {
      await sandbox.close();
    }
  });
});
