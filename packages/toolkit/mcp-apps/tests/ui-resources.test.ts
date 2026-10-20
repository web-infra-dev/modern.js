import os from 'node:os';
import path from 'node:path';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { afterEach, expect, it, describe } from '@rstest/core';
import type { McpAppsDefinition } from '../src/config';
import { createMcpHandler } from '../src/server';
import { bindUiResources, getUiEntryName } from '../src/resources';
import type { McpUiHostContext } from '@modelcontextprotocol/ext-apps';
import {
  canRequestDisplayMode,
  subscribeHostContext,
} from '../src/mf-runtime/host-context';

describe('ui-resources', () => {
  const dirs: string[] = [];
  afterEach(async () => {
    await Promise.all(
      dirs.splice(0).map(dir => rm(dir, { recursive: true, force: true })),
    );
  });

  it('uses externally built HTML without compiling the UI source and isolates request asset origins', async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), 'modern-built-ui-'));
    dirs.push(dir);
    const definition: McpAppsDefinition = {
      viewDefaults: {
        assetBase: 'request',
        csp: { connectDomains: ['https://api.example'] },
      },
      remotes: [],
      tools: [{ name: 'card', view: { module: './not-compiled-here.tsx' } }],
    };
    await writeFile(
      path.join(dir, `${getUiEntryName('card')}.html`),
      '<html><head></head><body><script src="/static/card.js"></script></body></html>',
    );
    const handle = createMcpHandler(
      bindUiResources(definition, { directory: dir }),
    );
    for (const host of ['one.example', 'two.example']) {
      const response = await handle(
        new Request(`http://${host}/mcp`, {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            accept: 'application/json, text/event-stream',
            'x-forwarded-proto': 'https',
          },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            method: 'resources/read',
            params: { uri: 'ui://local/card' },
          }),
        }),
      );
      const content = (await response.json()).result.contents[0];
      expect(content.text).toContain(`<base href="https://${host}/">`);
      expect(content.text).toContain('src="/static/card.js"');
      expect(content._meta.ui.csp.connectDomains).toEqual([
        'https://api.example',
        `https://${host}`,
      ]);
      expect(content._meta.ui.csp.resourceDomains).toEqual([`https://${host}`]);
      expect(content._meta.ui.csp.baseUriDomains).toEqual([`https://${host}`]);
    }
    expect(definition.tools[0].view?.html).toBeUndefined();
  });

  it('serves an MF runtime that advertises fullscreen during app initialization', async () => {
    const handle = createMcpHandler({
      remotes: [
        { name: 'ui', baseUrl: 'https://cdn.example.com/mf-manifest.json' },
      ],
      tools: [{ name: 'card', remote: 'ui', view: { module: './Card' } }],
    });
    const response = await handle(
      new Request('http://localhost/mcp', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          accept: 'application/json, text/event-stream',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'resources/read',
          params: { uri: 'ui://mf/ui/card' },
        }),
      }),
    );
    const result = await response.json();
    expect(result.error).toBeUndefined();
    // Check the shipped HTML, so a stale runtime bundle cannot pass this regression.
    expect(result.result.contents[0].text).toMatch(
      /capabilities:\{availableDisplayModes:\["inline","fullscreen"\]\}/,
    );
  });

  it('exports only local view metadata and reads relocated manifest resources', async () => {
    const { createUiManifest, readUiManifestResource, createMcpViewResult } =
      await import('../src/server');
    const dir = await mkdtemp(path.join(os.tmpdir(), 'modern-ui-manifest-'));
    dirs.push(dir);
    const manifest = createUiManifest(
      {
        remotes: [],
        viewDefaults: { csp: { connectDomains: ['https://api.example'] } },
        tools: [
          {
            name: 'greet',
            handler: () => ({ content: [] }),
            view: { module: './private/source.tsx', html: './card.html' },
          },
          { name: 'plain', handler: () => ({ content: [] }) },
        ],
      },
      { assetBase: 'https://cdn.example/app/' },
    );
    expect(Object.keys(manifest.tools)).toEqual(['greet']);
    expect(JSON.stringify(manifest)).not.toContain('private');
    await writeFile(
      path.join(dir, 'card.html'),
      '<html><head></head><body></body></html>',
    );
    const content = await readUiManifestResource(
      JSON.parse(JSON.stringify(manifest)),
      'greet',
      { directory: dir },
    );
    expect(content.uri).toBe('ui://local/greet');
    expect(content.text).toContain('<base href="https://cdn.example/app/">');
    expect(content._meta.ui.csp).toMatchObject({
      resourceDomains: ['https://cdn.example'],
      connectDomains: ['https://api.example', 'https://cdn.example'],
    });
    expect(
      createMcpViewResult(
        { name: 'Ada' },
        {
          structuredContent: { extra: true },
          viewProps: { message: 'Hello Ada' },
        },
      ),
    ).toMatchObject({
      content: [],
      structuredContent: {
        args: { name: 'Ada' },
        extra: true,
        viewProps: { message: 'Hello Ada' },
      },
    });
    await expect(
      readUiManifestResource(manifest, 'missing', { directory: dir }),
    ).rejects.toThrow('Unknown MCP UI tool');
  });

  it('binds manifest paths rather than recomputing hashed names', () => {
    const definition: McpAppsDefinition = {
      remotes: [],
      tools: [{ name: 'card', view: { module: './Card' } }],
    };
    const bound = bindUiResources(definition, {
      directory: '/app/mcp-apps/ui',
      manifest: {
        version: 1,
        tools: {
          card: {
            resourceUri: 'ui://local/card',
            mimeType: 'text/html;profile=mcp-app',
            html: './ui/custom.html',
            ui: {},
          },
        },
      },
    });
    expect(bound.tools[0].view?.html).toBe('/app/mcp-apps/ui/custom.html');
  });
});

describe('host-context', () => {
  it('requests only modes advertised by the host', () => {
    expect(canRequestDisplayMode(undefined, 'fullscreen')).toBe(false);
    expect(
      canRequestDisplayMode(
        { availableDisplayModes: ['inline'] },
        'fullscreen',
      ),
    ).toBe(false);
    expect(
      canRequestDisplayMode(
        { availableDisplayModes: ['inline', 'fullscreen'] },
        'fullscreen',
      ),
    ).toBe(true);
  });

  it('synchronizes initial context and cleans up only its own listener', () => {
    type Listener = (context: McpUiHostContext) => void;
    const listeners = new Set<Listener>();
    const remoteListener: Listener = () => {};
    listeners.add(remoteListener);
    const received: McpUiHostContext[] = [];
    const cleanup = subscribeHostContext(
      {
        getHostContext: () => ({ displayMode: 'fullscreen' }),
        addEventListener: (_event, listener) => {
          listeners.add(listener);
        },
        removeEventListener: (_event, listener) => {
          listeners.delete(listener);
        },
      },
      context => received.push(context),
    );
    expect(received).toEqual([{ displayMode: 'fullscreen' }]);
    for (const listener of listeners) listener({ displayMode: 'inline' });
    expect(received[1]).toEqual({ displayMode: 'inline' });
    cleanup();
    expect([...listeners]).toEqual([remoteListener]);
  });
});
