import fs from 'node:fs/promises';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { PassThrough } from 'node:stream';
import { afterAll, describe, expect, it } from '@rstest/core';
import { Client } from '@modelcontextprotocol/client';
import { StdioClientTransport } from '@modelcontextprotocol/client/stdio';
import { McpServer } from '@modelcontextprotocol/server';
import { registerAppTool } from '@modelcontextprotocol/ext-apps/server';
import { z } from 'zod';
import { mcpAppsPlugin } from '../src/cli';
import { createUiManifest, validateInlineHtml } from '../src/cli/build';
import {
  createStdioBridge,
  parseStdioCliArgs,
  readDevServerUrl,
} from '../src/cli/stdio';
import { createFetchHandler, registerUiResources } from '../src/server';

const root = path.resolve(__dirname, '..');
const binPath = path.join(root, 'bin/modern-mcp-stdio.js');
const tempDirs: string[] = [];

async function makeTempDir(prefix: string) {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), prefix));
  tempDirs.push(dir);
  return dir;
}

afterAll(async () => {
  await Promise.all(
    tempDirs.map(dir => fs.rm(dir, { recursive: true, force: true })),
  );
});

async function startFetchServer(
  handler: (request: Request) => Promise<Response>,
) {
  const server = http.createServer(async (req, res) => {
    const chunks: Buffer[] = [];
    for await (const chunk of req) chunks.push(Buffer.from(chunk));
    const url = `http://127.0.0.1:${(server.address() as { port: number }).port}${req.url ?? '/'}`;
    const headers = new Headers();
    for (const [key, value] of Object.entries(req.headers)) {
      if (Array.isArray(value))
        for (const item of value) headers.append(key, item);
      else if (value !== undefined) headers.set(key, value);
    }
    const request = new Request(url, {
      method: req.method,
      headers,
      ...(req.method === 'GET' || req.method === 'HEAD'
        ? {}
        : { body: Buffer.concat(chunks) }),
    });
    const response = await handler(request);
    res.writeHead(response.status, Object.fromEntries(response.headers));
    if (response.body) {
      for await (const chunk of response.body as AsyncIterable<Uint8Array>)
        res.write(chunk);
    }
    res.end();
  });
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address() as { port: number };
  return {
    url: `http://127.0.0.1:${port}/api/mcp`,
    close: async () => {
      server.closeAllConnections();
      await new Promise<void>((resolve, reject) =>
        server.close(err => (err ? reject(err) : resolve())),
      );
    },
  };
}

describe('stdio-to-HTTP bridge', () => {
  it('forwards MCP calls, custom middleware headers, and live-updated inline HTML over stdio', async () => {
    const dir = await makeTempDir('modern-mcp-bridge-');
    await fs.mkdir(path.join(dir, 'ui'));
    const htmlPath = path.join(dir, 'ui/local.html');
    const initialHtml =
      '<!doctype html><html><head><style>body{color:red}</style></head><body><div id="root">v1</div><script>window.__v=1;</script></body></html>';
    await fs.writeFile(htmlPath, initialHtml);
    const manifestPath = path.join(dir, 'ui-manifest.json');
    await fs.writeFile(
      manifestPath,
      JSON.stringify({
        version: 1,
        assetBase: 'request',
        remotes: {},
        views: {
          local: {
            html: './ui/local.html',
            inline: true,
            ui: { prefersBorder: true },
          },
        },
      }),
    );

    const mcpHandler = createFetchHandler(async request => {
      const server = new McpServer({ name: 'bridge-test', version: '1.0.0' });
      const ui = await registerUiResources(server, {
        request,
        manifest: manifestPath,
        mode: 'development',
      });
      registerAppTool(
        server,
        'show_card',
        {
          description: 'Open inline card',
          inputSchema: z.object({ label: z.string() }),
          _meta: { ui: { resourceUri: ui.local } },
        },
        async ({ label }) => ({
          content: [{ type: 'text', text: `card:${label}` }],
          structuredContent: { label },
        }),
      );
      return server;
    });

    // Wrap with a user-style auth middleware to verify headers pass through.
    const httpServer = await startFetchServer(async request => {
      if (request.headers.get('x-dev-token') !== 'secret-123')
        return new Response('Unauthorized', { status: 401 });
      return mcpHandler(request);
    });

    const transport = new StdioClientTransport({
      command: process.execPath,
      args: [binPath, httpServer.url, '--header', 'x-dev-token: secret-123'],
      stderr: 'pipe',
    });
    const client = new Client({ name: 'stdio-bridge-test', version: '1.0.0' });
    try {
      await client.connect(transport);
      const { tools } = await client.listTools();
      expect(tools.map(t => t.name)).toContain('show_card');

      const result = await client.callTool({
        name: 'show_card',
        arguments: { label: 'hello' },
      });
      expect(result.structuredContent).toEqual({ label: 'hello' });

      const firstRead = await client.readResource({ uri: 'ui://app/local' });
      expect(firstRead.contents[0].text).toBe(initialHtml);
      expect(firstRead.contents[0]._meta).toEqual({
        ui: { prefersBorder: true },
      });
      expect(JSON.stringify(firstRead.contents[0]._meta)).not.toContain(
        '127.0.0.1',
      );

      // Simulate a dev watch rebuild updating the inline HTML on disk.
      const updatedHtml =
        '<!doctype html><html><head></head><body><div id="root">v2</div></body></html>';
      await fs.writeFile(htmlPath, updatedHtml);
      const secondRead = await client.readResource({ uri: 'ui://app/local' });
      expect(secondRead.contents[0].text).toBe(updatedHtml);
    } finally {
      await client.close();
      await transport.close();
      await httpServer.close();
    }
  }, 30_000);

  it('streams SSE events, preserves Mcp-Session-Id, ignores 202 notifications, and recovers from upstream downtime', async () => {
    const input = new PassThrough();
    const output = new PassThrough();
    const error = new PassThrough();
    const receivedLines: unknown[] = [];
    let outBuf = '';
    output.on('data', chunk => {
      outBuf += String(chunk);
      let idx: number;
      while ((idx = outBuf.indexOf('\n')) !== -1) {
        receivedLines.push(JSON.parse(outBuf.slice(0, idx)));
        outBuf = outBuf.slice(idx + 1);
      }
    });

    const requests: Array<{
      method: string;
      sessionId: string | null;
      body: string;
    }> = [];
    let offline = true;

    const bridge = createStdioBridge({
      url: 'http://localhost:8088/api/mcp',
      input,
      output,
      error,
      fetch: async (_url, init) => {
        const method = init?.method ?? 'GET';
        const headers = new Headers(init?.headers);
        const body = typeof init?.body === 'string' ? init.body : '';
        requests.push({
          method,
          sessionId: headers.get('mcp-session-id'),
          body,
        });
        if (method === 'DELETE') return new Response(null, { status: 204 });
        if (offline) throw new TypeError('fetch failed: ECONNREFUSED');
        const msg = JSON.parse(body);
        if (msg.method === 'notifications/initialized')
          return new Response(null, { status: 202 });
        if (msg.method === 'initialize') {
          return Response.json(
            { jsonrpc: '2.0', id: msg.id, result: { ok: true } },
            { headers: { 'mcp-session-id': 'sess-42' } },
          );
        }
        const sse = [
          ': keep-alive\r\n',
          `data: ${JSON.stringify({ jsonrpc: '2.0', method: 'notifications/progress', params: { progress: 1 } })}\r\n\r\n`,
          `data: ${JSON.stringify({ jsonrpc: '2.0', id: msg.id, result: { done: true } })}\r\n\r\n`,
        ].join('');
        return new Response(sse, {
          status: 200,
          headers: { 'content-type': 'text/event-stream' },
        });
      },
    });

    // 1. Upstream offline -> bridge returns JSON-RPC error instead of crashing.
    input.write(
      `${JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'initialize' })}\n`,
    );
    await new Promise(resolve => setTimeout(resolve, 30));
    expect(receivedLines[0]).toMatchObject({
      jsonrpc: '2.0',
      id: 1,
      error: { code: -32000 },
    });

    // 2. Upstream comes online -> initialize sets session, notification gets 202, SSE streams both events.
    offline = false;
    input.write(
      `${JSON.stringify({ jsonrpc: '2.0', id: 2, method: 'initialize' })}\n`,
    );
    await new Promise(resolve => setTimeout(resolve, 30));
    input.write(
      `${JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' })}\n`,
    );
    input.write(
      `${JSON.stringify({ jsonrpc: '2.0', id: 3, method: 'tools/call' })}\n`,
    );
    input.end();
    await bridge.done;

    expect(receivedLines).toEqual([
      expect.objectContaining({ id: 1, error: expect.anything() }),
      { jsonrpc: '2.0', id: 2, result: { ok: true } },
      {
        jsonrpc: '2.0',
        method: 'notifications/progress',
        params: { progress: 1 },
      },
      { jsonrpc: '2.0', id: 3, result: { done: true } },
    ]);
    expect(requests.find(r => r.body.includes('tools/call'))?.sessionId).toBe(
      'sess-42',
    );
    expect(requests.at(-1)).toMatchObject({
      method: 'DELETE',
      sessionId: 'sess-42',
    });
  });

  it('parses CLI options and discovers dev server URL from --cwd', async () => {
    expect(
      parseStdioCliArgs([
        'http://localhost:8088/api/mcp',
        '-H',
        'Authorization: Bearer abc',
        '--timeout',
        '5000',
      ]),
    ).toEqual({
      url: 'http://localhost:8088/api/mcp',
      cwd: undefined,
      headers: { Authorization: 'Bearer abc' },
      timeoutMs: 5000,
      help: false,
    });
    expect(() => parseStdioCliArgs(['ftp://localhost:8088/api/mcp'])).toThrow();
    expect(() => parseStdioCliArgs(['--header', 'bad-header'])).toThrow();

    const appDir = await makeTempDir('modern-mcp-cwd-');
    await fs.mkdir(path.join(appDir, '.modern-js/mcp-apps'), {
      recursive: true,
    });
    await fs.writeFile(
      path.join(appDir, '.modern-js/mcp-apps/dev-server.json'),
      JSON.stringify({ url: 'http://localhost:8091/api/mcp', inline: true }),
    );
    expect(await readDevServerUrl(appDir)).toBe(
      'http://localhost:8091/api/mcp',
    );
  });
});

describe('inline dev build mode', () => {
  it('bundles local views into self-contained HTML during dev without polluting app entrypoints', async () => {
    const internalDir = await makeTempDir('modern-mcp-inline-dev-');
    let modifyEntrypointsHook!: (input: { entrypoints: unknown[] }) => Promise<{
      entrypoints: unknown[];
    }>;
    let afterCreateCompilerHook!: (input: unknown) => void;
    let devCompileDoneHook!: (input: {
      isFirstCompile: boolean;
    }) => Promise<void>;
    let beforeRestartHook: (() => Promise<void>) | undefined;

    mcpAppsPlugin({
      views: 'tests/fixtures/mcp-views-stdio.json',
      inline: 'dev',
    }).setup!({
      getAppContext: () => ({
        appDirectory: root,
        distDirectory: path.join(root, 'dist'),
        internalDirectory: internalDir,
        command: 'dev',
        port: 8088,
      }),
      getNormalizedConfig: () => ({
        source: { alias: {}, define: {}, enableAsyncEntry: false },
        dev: { assetPrefix: '/' },
        output: { assetPrefix: '/' },
        bff: { prefix: '/api' },
      }),
      _internalServerPlugins() {},
      addWatchFiles() {},
      modifyEntrypoints: (fn: typeof modifyEntrypointsHook) => {
        modifyEntrypointsHook = fn;
      },
      modifyRsbuildConfig() {},
      onAfterCreateCompiler: (fn: typeof afterCreateCompilerHook) => {
        afterCreateCompilerHook = fn;
      },
      onBeforeRestart: (fn: () => Promise<void>) => {
        beforeRestartHook = fn;
      },
      onDevCompileDone: (fn: typeof devCompileDoneHook) => {
        devCompileDoneHook = fn;
      },
    } as never);

    const { entrypoints } = await modifyEntrypointsHook({ entrypoints: [] });
    // Inline views must stay isolated from the main app's multi-entry HMR pipeline.
    expect(entrypoints).toEqual([]);

    let beforeCompileFn!: () => Promise<void>;
    let afterEmitFn!: (compilation: {
      errors: unknown[];
      getAssets: () => unknown[];
    }) => Promise<void>;

    afterCreateCompilerHook({
      compiler: {
        name: 'client',
        close: (cb: (err?: Error) => void) => cb(),
        webpack: {
          Compilation: { PROCESS_ASSETS_STAGE_REPORT: 0 },
          sources: { RawSource: class {} },
        },
        hooks: {
          invalid: { tap() {} },
          beforeCompile: {
            tapPromise: (_name: string, fn: () => Promise<void>) => {
              beforeCompileFn = fn;
            },
          },
          thisCompilation: { tap() {} },
          afterEmit: {
            tapPromise: (
              _name: string,
              fn: (compilation: {
                errors: unknown[];
                getAssets: () => unknown[];
              }) => Promise<void>,
            ) => {
              afterEmitFn = fn;
            },
          },
        },
      },
      environments: {
        client: { config: { output: { target: 'web' } }, htmlPaths: {} },
      },
    });

    try {
      await beforeCompileFn();
      await afterEmitFn({ errors: [], getAssets: () => [] });
      await devCompileDoneHook({ isFirstCompile: true });

      const manifestPath = path.join(internalDir, 'mcp-apps/ui-manifest.json');
      const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'));
      expect(manifest.views.local.inline).toBe(true);
      expect(manifest.views.local.ui).toEqual({ prefersBorder: true });

      const html = await fs.readFile(
        path.resolve(path.dirname(manifestPath), manifest.views.local.html),
        'utf8',
      );
      expect(html).toContain('<script');
      expect(html).toContain('<style');
      expect(html).toContain('data:image/svg+xml');
      const markupOnly = html.replace(
        /<script\b([^>]*)>[\s\S]*?<\/script\s*>/gi,
        '<script$1></script>',
      );
      expect(markupOnly).not.toMatch(/<script[^>]*\bsrc=|<base\b/);

      const devInfo = JSON.parse(
        await fs.readFile(
          path.join(internalDir, 'mcp-apps/dev-server.json'),
          'utf8',
        ),
      );
      expect(devInfo).toEqual({
        url: 'http://localhost:8088/api/mcp',
        inline: true,
      });
    } finally {
      await beforeRestartHook?.();
    }
  }, 60_000);

  it('keeps normal multi-entry output during production build when inline is "dev"', async () => {
    const internalDir = await makeTempDir('modern-mcp-inline-prod-');
    let modifyEntrypointsHook!: (input: { entrypoints: unknown[] }) => Promise<{
      entrypoints: unknown[];
    }>;

    mcpAppsPlugin({
      views: 'tests/fixtures/mcp-views-stdio.json',
      inline: 'dev',
    }).setup!({
      getAppContext: () => ({
        appDirectory: root,
        distDirectory: path.join(root, 'dist'),
        internalDirectory: internalDir,
        command: 'build',
      }),
      getNormalizedConfig: () => ({
        source: { alias: {}, define: {}, enableAsyncEntry: false },
        dev: { assetPrefix: '/' },
        output: { assetPrefix: '/' },
      }),
      _internalServerPlugins() {},
      addWatchFiles() {},
      modifyEntrypoints: (fn: typeof modifyEntrypointsHook) => {
        modifyEntrypointsHook = fn;
      },
      modifyRsbuildConfig() {},
      onAfterCreateCompiler() {},
      onDevCompileDone() {},
    } as never);

    const { entrypoints } = await modifyEntrypointsHook({ entrypoints: [] });
    expect(entrypoints).toHaveLength(1);
  });

  it('marks only local views inline in mixed local + MF manifests and enforces inline HTML limits', () => {
    const manifest = createUiManifest(
      {
        views: {
          local: './Local.tsx',
          todos: { expose: './Todos' },
        },
      },
      'https://cdn.example/app/',
      {
        filename: 'static/mf-manifest.json',
        manifest: { name: 'todo_ui', exposes: [{ name: './Todos' }] },
      },
      undefined,
      { inline: true },
    );
    expect(manifest.views.local).toMatchObject({
      inline: true,
      ui: { prefersBorder: true },
    });
    expect(manifest.views.local.ui.csp).toBeUndefined();
    expect(manifest.views.todos).toMatchObject({
      remote: 'todo_ui',
      expose: './Todos',
    });

    expect(() =>
      validateInlineHtml('bad', '<script src="/app.js"></script>'),
    ).toThrow('external assets');
    expect(() =>
      validateInlineHtml(
        'huge',
        `<div>${'x'.repeat(5 * 1024 * 1024 + 1)}</div>`,
      ),
    ).toThrow('5 MiB');
  });
});
