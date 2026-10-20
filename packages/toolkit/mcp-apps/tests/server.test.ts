import os from 'node:os';
import path from 'node:path';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { afterEach, describe, expect, it } from '@rstest/core';
import { defineMcpApps } from '../src/config';
import type { McpAppsDefinition, RemoteToolHandler } from '../src/config';
import {
  createArtifactHandler,
  createMcpAppsHandler,
  createMcpHandler,
  loadMcpAppsConfig,
} from '../src/server';
import { createMcpBffHandler } from '../src/bff';

describe('server', () => {
  function definition(): McpAppsDefinition {
    return defineMcpApps({
      remotes: [
        {
          name: 'greeting_ui',
          baseUrl: 'https://cdn.example.com/v42/mf-manifest.json',
          csp: {
            resourceDomains: ['https://cdn.example.com'],
            connectDomains: ['https://cdn.example.com'],
          },
        },
      ],
      tools: [
        {
          name: 'greet',
          remote: 'greeting_ui',
          view: { module: './Greeting' },
          handler: { module: './tools', exportName: 'greet' },
          annotations: { readOnlyHint: true },
          inputSchema: {
            type: 'object',
            additionalProperties: false,
            properties: {
              name: { type: 'string', minLength: 2, pattern: '^[A-Z]' },
              level: { type: 'integer', enum: [1, 2] },
            },
            required: ['name', 'level'],
          },
          outputSchema: {
            type: 'object',
            properties: { greeting: { type: 'string' } },
            required: ['greeting'],
          },
        },
      ],
    });
  }
  const greet: RemoteToolHandler = input => {
    const message = `Hello ${(input as { name: string }).name}`;
    return {
      content: [{ type: 'text', text: message }],
      structuredContent: { greeting: message },
      viewProps: { message },
      _meta: { privateUiData: 'not model content' },
    };
  };
  const endpoint = (config = definition(), handler = greet) =>
    createMcpHandler(config, { loadRemoteHandler: async () => handler });
  function request(
    method: string,
    params?: unknown,
    headers?: Record<string, string>,
  ) {
    return new Request('http://localhost/mcp', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        accept: 'application/json, text/event-stream',
        ...headers,
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method,
        ...(params === undefined ? {} : { params }),
      }),
    });
  }
  const call = () =>
    request('tools/call', {
      name: 'greet',
      arguments: { name: 'Ada', level: 1 },
    });
  const directories: string[] = [];
  afterEach(async () => {
    await Promise.all(
      directories
        .splice(0)
        .map(dir => rm(dir, { recursive: true, force: true })),
    );
  });
  async function tempDir() {
    const dir = await mkdtemp(path.join(os.tmpdir(), 'modern-mcp-config-'));
    directories.push(dir);
    return dir;
  }

  describe('MCP Apps definition and stateless HTTP', () => {
    it('initializes and exposes the original schema and per-tool UI URI', async () => {
      const handler = endpoint();
      const response = await handler(
        request('initialize', {
          protocolVersion: '2025-11-25',
          capabilities: {},
          clientInfo: { name: 'test', version: '1' },
        }),
      );
      expect(response.status).toBe(200);
      expect(response.headers.get('mcp-session-id')).toBeNull();
      const listed = await (await handler(request('tools/list'))).json();
      expect(listed.result.tools[0].inputSchema).toEqual(
        definition().tools[0].inputSchema,
      );
      expect(listed.result.tools[0]._meta.ui.resourceUri).toBe(
        'ui://mf/greeting-ui/greet',
      );
      expect(listed.result.tools[0]._meta['openai/outputTemplate']).toBe(
        'ui://mf/greeting-ui/greet',
      );
    });

    it('serves the bundled MCP Apps renderer and composes business output with MF/viewProps metadata', async () => {
      const handler = endpoint();
      const listed = await (await handler(request('resources/list'))).json();
      expect(listed.result.resources).toHaveLength(2);
      expect(listed.result.resources[0]).not.toHaveProperty('text');
      const read = await (
        await handler(
          request('resources/read', { uri: 'ui://mf/greeting-ui/greet' }),
        )
      ).json();
      expect(read.result.contents[0].text).toContain('<script');
      expect(read.result.contents[0].mimeType).toBe(
        'text/html;profile=mcp-app',
      );
      expect(read.result.contents[0]._meta.ui.csp.connectDomains).toEqual([
        'https://cdn.example.com',
      ]);
      const result = (await (await handler(call())).json()).result;
      expect(result.structuredContent).toMatchObject({
        greeting: 'Hello Ada',
        tool: 'greet',
        args: { name: 'Ada', level: 1 },
        viewProps: { message: 'Hello Ada' },
        resource: {
          moduleFederation: {
            remoteName: 'greeting_ui',
            remoteEntry: 'https://cdn.example.com/v42/mf-manifest.json',
            module: './Greeting',
            exportName: 'default',
          },
        },
      });
      expect(result.content).toEqual([{ type: 'text', text: 'Hello Ada' }]);
      expect(result._meta).toEqual({ privateUiData: 'not model content' });
    });

    it.each([
      { name: 'a', level: 1 },
      { name: 'ada', level: 1 },
      { name: 'Ada', level: '1' },
      { name: 'Ada', level: 3 },
      { name: 'Ada', level: 1, extra: true },
    ])('preserves input constraints: %j', async input => {
      const result = await (
        await endpoint()(
          request('tools/call', { name: 'greet', arguments: input }),
        )
      ).json();
      expect(result.result.isError).toBe(true);
    });

    it('supports backend-only tools without remote metadata or fabricated read-only hints', async () => {
      const handler = endpoint({
        remotes: [],
        tools: [
          {
            name: 'greet',
            handler: { module: './tools' },
            annotations: { readOnlyHint: false },
          },
        ],
      });
      const listed = await (await handler(request('tools/list'))).json();
      expect(listed.result.tools[0].annotations.readOnlyHint).toBe(false);
      expect(listed.result.tools[0]).not.toHaveProperty('_meta');
      expect(
        (await (await handler(request('resources/list'))).json()).result
          .resources,
      ).toEqual([]);
      expect(
        (
          await (
            await handler(
              request('tools/call', {
                name: 'greet',
                arguments: { name: 'Ada' },
              }),
            )
          ).json()
        ).result.structuredContent,
      ).toEqual({ greeting: 'Hello Ada' });
    });

    it('supports view-only tools and legacy view fields with mount rendering', async () => {
      const config = definition();
      delete config.tools[0].handler;
      delete config.tools[0].view;
      config.tools[0].module = './Mount';
      config.tools[0].renderMode = 'mount';
      const result = (await (await endpoint(config)(call())).json()).result;
      expect(result.structuredContent.resource.moduleFederation).toMatchObject({
        module: './Mount',
        renderMode: 'mount',
      });
      expect(JSON.parse(result.content[0].text).tool).toBe('greet');
    });

    it('isolates overlapping identical request IDs and passes handler context', async () => {
      const handler = createMcpHandler(definition(), {
        createContext: req => ({ user: req.headers.get('x-user') }),
        loadRemoteHandler: async ({ handler, remote }) => {
          expect(handler.exportName).toBe('greet');
          expect(remote?.name).toBe('greeting_ui');
          return async (_, ctx) => {
            expect(ctx.toolName).toBe('greet');
            expect(ctx.fetchJson).toBeTypeOf('function');
            await new Promise(resolve => setTimeout(resolve, 5));
            return {
              structuredContent: {
                greeting: String((ctx.context as { user: string }).user),
              },
            };
          };
        },
      });
      const result = await Promise.all(
        ['A', 'B'].map(
          async user =>
            (
              await (
                await handler(
                  request(
                    'tools/call',
                    { name: 'greet', arguments: { name: 'Ada', level: 1 } },
                    { 'x-user': user },
                  ),
                )
              ).json()
            ).result.structuredContent.greeting,
        ),
      );
      expect(result).toEqual(['A', 'B']);
    });

    it('validates business output before injecting view metadata and hides unexpected failures', async () => {
      const handler = endpoint(definition(), () => ({
        structuredContent: { greeting: 42 },
      }));
      expect(
        (await (await handler(call())).json()).result.content[0].text,
      ).toBe('Tool execution failed');
      const broken = endpoint(definition(), () => {
        throw new Error('secret');
      });
      expect(JSON.stringify(await (await broken(call())).json())).not.toContain(
        'secret',
      );
      expect((await broken(request('tools/list'))).status).toBe(200);
    });

    it('bounds handler loading/execution and propagates cancellation', async () => {
      const config = definition();
      config.tools[0].handler!.timeoutMs = 10;
      let signal: AbortSignal | undefined;
      const handler = endpoint(config, (_, ctx) => {
        signal = ctx.signal;
        return new Promise(() => {});
      });
      expect(
        (await (await handler(call())).json()).result.content[0].text,
      ).toBe('Tool timed out');
      expect(signal?.aborted).toBe(true);
      const controller = new AbortController();
      const cancelled = endpoint(definition(), () => {
        controller.abort();
        return new Promise(() => {});
      });
      const response = await cancelled(
        new Request(call(), { signal: controller.signal }),
      );
      expect((await response.json()).result.content[0].text).toBe(
        'Tool cancelled',
      );
    });

    it('handles notifications and malformed/unknown requests', async () => {
      const handler = endpoint();
      const notification = new Request('http://localhost/mcp', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          accept: 'application/json, text/event-stream',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'notifications/initialized',
        }),
      });
      expect((await handler(notification)).status).toBe(202);
      const malformed = new Request('http://localhost/mcp', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          accept: 'application/json, text/event-stream',
        },
        body: '{',
      });
      expect((await handler(malformed)).status).toBe(400);
      expect(
        (await (await handler(request('unknown'))).json()).error.code,
      ).toBe(-32601);
      expect(
        (
          await (
            await handler(request('resources/read', { uri: 'ui://missing' }))
          ).json()
        ).error.code,
      ).toBe(-32602);
      for (const method of ['GET', 'DELETE'])
        expect(
          (await handler(new Request('http://localhost/mcp', { method })))
            .status,
        ).toBe(405);
    });
  });

  describe('configuration validation and loading', () => {
    it('rejects duplicate tools, URI collisions, missing remotes and unsupported schema keywords', () => {
      const duplicate = definition();
      duplicate.tools.push(duplicate.tools[0]);
      expect(() => endpoint(duplicate)).toThrow();
      const missing = definition();
      missing.tools[0].remote = 'missing';
      expect(() => endpoint(missing)).toThrow('missing remote');
      const schema = definition();
      schema.tools[0].inputSchema!.typoKeyword = true;
      expect(() => endpoint(schema)).toThrow('typoKeyword');
      const collision = definition();
      collision.tools.push({ ...collision.tools[0], name: 'GREET' });
      expect(() => endpoint(collision)).toThrow('collision');
    });

    it('loads application-compiled modules with normal static imports', async () => {
      const dir = await tempDir();
      await writeFile(
        path.join(dir, 'mcp_apps.mjs'),
        `export default ${JSON.stringify(definition())}`,
      );
      await writeFile(
        path.join(dir, 'helper.mjs'),
        'export const message = "From JS";',
      );
      await writeFile(
        path.join(dir, 'tools.mjs'),
        `import { message } from './helper.mjs'; export function greet() { return { structuredContent: { greeting: message }, viewProps: { message } }; }`,
      );
      const configPath = path.join(dir, 'mcp_apps.mjs');
      expect(
        (await loadMcpAppsConfig(configPath)).tools[0].handler?.module,
      ).toBe('./tools');
      const result = (
        await (await createMcpAppsHandler({ configPath })(call())).json()
      ).result;
      expect(result.structuredContent.greeting).toBe('From JS');
      expect(result.structuredContent.viewProps).toEqual({
        message: 'From JS',
      });
    });

    it('loads compiled config/handler without TS source and retries failed initialization', async () => {
      const dir = await tempDir();
      const handler = createMcpAppsHandler({
        configPath: path.join(dir, 'mcp_apps'),
      });
      await expect(handler(call())).rejects.toThrow();
      await writeFile(
        path.join(dir, 'mcp_apps.mjs'),
        `export default ${JSON.stringify(definition())}`,
      );
      await writeFile(
        path.join(dir, 'tools.mjs'),
        'export function greet() { return { structuredContent: { greeting: "Compiled" } }; }',
      );
      expect(
        (await (await handler(call())).json()).result.structuredContent
          .greeting,
      ).toBe('Compiled');
    });

    for (const development of [false, true]) {
      it(`shares file loading and context across adapters in ${development ? 'development' : 'production'}`, async () => {
        const dir = await tempDir();
        const entry = path.join(dir, 'mcp_apps.mjs');
        const save = (version: string) =>
          writeFile(
            entry,
            `export default { remotes: [], tools: [{ name: 'greet', handler: (_, ctx) => ({ structuredContent: { version: '${version}', user: ctx.context.user } }) }] };`,
          );
        await save('first');
        const artifact = createArtifactHandler<{ user: string }>(entry, {
          development,
        });
        const fromFile = createMcpAppsHandler({
          configPath: path.join(dir, 'mcp_apps'),
          development,
          createContext: async () => ({ user: 'callback' }),
        });
        const read = async (response: Promise<Response>) =>
          (await (await response).json()).result.structuredContent;
        expect(
          await Promise.all([
            read(artifact.handle(call(), { user: 'Ada' })),
            read(artifact.handle(call(), { user: 'Grace' })),
            read(fromFile(call())),
          ]),
        ).toEqual([
          { version: 'first', user: 'Ada' },
          { version: 'first', user: 'Grace' },
          { version: 'first', user: 'callback' },
        ]);
        await save('second');
        const expectedVersion = development ? 'second' : 'first';
        expect(await read(artifact.handle(call(), { user: 'Ada' }))).toEqual({
          version: expectedVersion,
          user: 'Ada',
        });
        expect(await read(fromFile(call()))).toEqual({
          version: expectedVersion,
          user: 'callback',
        });
        artifact.reset();
        expect(await read(artifact.handle(call(), { user: 'reset' }))).toEqual({
          version: 'second',
          user: 'reset',
        });
      });
    }

    it('cancels an in-flight file-backed tool when its handler is reset', async () => {
      const dir = await tempDir();
      const entry = path.join(dir, 'mcp_apps.mjs');
      await writeFile(
        entry,
        `export default { remotes: [], tools: [{ name: 'greet', handler: { module: './tools' } }] };`,
      );
      const started = Promise.withResolvers<void>();
      let signal: AbortSignal | undefined;
      const artifact = createArtifactHandler(entry, {
        loadRemoteHandler: async () => (_, context) => {
          signal = context.signal;
          started.resolve();
          return new Promise(() => {});
        },
      });
      const pending = artifact.handle(call());
      await started.promise;
      artifact.reset();
      const result = (await (await pending).json()).result;
      expect(signal?.aborted).toBe(true);
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toBe('Tool cancelled');
    });

    it('supports an injected local handler loader with standard MF browser metadata', async () => {
      const config = definition();
      config.tools[0].handler!.runtime = 'local';
      const handler = createMcpHandler(config, {
        loadRemoteHandler: async options => {
          expect(options.handler.runtime).toBe('local');
          expect(options.remote?.name).toBe('greeting_ui');
          return greet;
        },
      });
      const result = (await (await handler(call())).json()).result;
      expect(result.structuredContent.greeting).toBe('Hello Ada');
      expect(result.structuredContent.resource.moduleFederation).toMatchObject({
        remoteName: 'greeting_ui',
        remoteEntry: 'https://cdn.example.com/v42/mf-manifest.json',
        module: './Greeting',
      });
      expect(
        result.structuredContent.resource.moduleFederation,
      ).not.toHaveProperty('manifestType');
    });

    it('retries a failed local handler load without restarting the endpoint', async () => {
      const dir = await tempDir();
      await writeFile(
        path.join(dir, 'mcp_apps.mjs'),
        `export default ${JSON.stringify(definition())}`,
      );
      const handler = createMcpAppsHandler({
        configPath: path.join(dir, 'mcp_apps.mjs'),
      });
      expect((await (await handler(call())).json()).result.isError).toBe(true);
      await writeFile(
        path.join(dir, 'tools.mjs'),
        'export function greet() { return { structuredContent: { greeting: "Recovered" } }; }',
      );
      expect(
        (await (await handler(call())).json()).result.structuredContent
          .greeting,
      ).toBe('Recovered');
    });
  });
});

describe('bff', () => {
  const handle = createMcpBffHandler({
    definition: {
      remotes: [],
      tools: [
        {
          name: 'who',
          handler: (_, ctx) => ({
            content: [],
            structuredContent: { user: (ctx.context as { user: string }).user },
          }),
        },
      ],
    },
  });

  async function call(
    body: string,
    user = 'Ada',
    accept = 'application/json, text/event-stream',
  ) {
    const raw = new Request('http://localhost/mcp', {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept },
      body,
    });
    let data: unknown;
    try {
      data = await raw.json();
    } catch {
      // BFF's input parser consumes invalid JSON and leaves data undefined.
    }
    expect(raw.bodyUsed).toBe(true);
    return handle({ data }, { req: { raw }, user } as Parameters<
      typeof handle
    >[1]);
  }

  describe('BFF MCP adapter', () => {
    it('handles consumed bodies and isolates concurrent request contexts', async () => {
      const body = JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/call',
        params: { name: 'who' },
      });
      const users = await Promise.all(
        ['Ada', 'Grace'].map(async user => {
          const response = await call(body, user);
          expect(response.status).toBe(200);
          return (await response.json()).result.structuredContent.user;
        }),
      );
      expect(users).toEqual(['Ada', 'Grace']);
    });

    it('preserves notification, parse-error and Accept-header behavior', async () => {
      const notification = await call(
        JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }),
      );
      expect(notification.status).toBe(202);
      expect(await notification.text()).toBe('');
      const invalid = await call('{broken');
      expect(invalid.status).toBe(400);
      expect((await invalid.json()).error.code).toBe(-32700);
      const unacceptable = await call(
        JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/list' }),
        'Ada',
        'text/html',
      );
      expect(unacceptable.status).toBe(406);
    });

    it('rejects unsupported methods without falling through to page rendering', async () => {
      for (const method of [
        'GET',
        'DELETE',
        'HEAD',
        'OPTIONS',
        'PUT',
        'PATCH',
      ]) {
        const response = await handle(
          {},
          { req: { raw: new Request('http://localhost/mcp', { method }) } },
        );
        expect(response.status).toBe(405);
        expect(response.headers.get('allow')).toBe('POST');
      }
    });
  });
});
