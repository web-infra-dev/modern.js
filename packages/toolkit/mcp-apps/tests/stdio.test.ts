import fs from 'node:fs/promises';
import path from 'node:path';
import { afterAll, describe, expect, it } from '@rstest/core';
import { Client } from '@modelcontextprotocol/client';
import { StdioClientTransport } from '@modelcontextprotocol/client/stdio';
import { mcpAppsPlugin } from '../src/cli';
import { prepareStdio } from '../src/cli/stdio';
const root = path.resolve(__dirname, '..');
let output: string;
afterAll(async () => {
  if (output) await fs.rm(output, { recursive: true, force: true });
});
describe('local stdio prepare', () => {
  it('builds and launches an MCP server without HTTP, returning self-contained UI', async () => {
    output = await fs.mkdtemp(path.join(root, '.test-stdio-'));
    let action!: () => Promise<void>;
    mcpAppsPlugin({
      views: 'tests/fixtures/mcp-views-stdio.json',
      stdio: {
        server: 'tests/fixtures/stdio-server.ts',
        output: path.basename(output),
      },
    }).setup!({
      addCommand: (hook: (input: unknown) => void) =>
        hook({
          program: {
            command: (name: string) => {
              expect(name).toBe('mcp-prepare');
              return {
                description: () => ({
                  action: (fn: () => Promise<void>) => {
                    action = fn;
                  },
                }),
              };
            },
          },
        }),
      getAppContext: () => ({
        appDirectory: root,
        distDirectory: path.join(root, 'dist'),
      }),
      getNormalizedConfig: () => ({ source: { alias: {}, define: {} } }),
      _internalServerPlugins() {},
      addWatchFiles() {},
      modifyEntrypoints() {},
      modifyRsbuildConfig() {},
      onAfterCreateCompiler() {},
    } as never);
    await action();
    const connector = {
      command: process.execPath,
      args: [path.join(output, 'server.cjs')],
    };
    const transport = new StdioClientTransport({
      ...connector,
      stderr: 'pipe',
    });
    const client = new Client({ name: 'stdio-test', version: '1' });
    try {
      await client.connect(transport);
      expect((await client.listTools()).tools.map(tool => tool.name)).toContain(
        'fixture',
      );
      const resource = await client.readResource({ uri: 'ui://app/local' });
      const html = String(resource.contents[0].text);
      expect(html).toContain('<script');
      expect(html).toContain('<style');
      expect(html).toContain('data:image/svg+xml');
      expect(html).not.toMatch(/<script[^>]*\bsrc=|<base\b/);
      expect(resource.contents[0]._meta).toMatchObject({
        ui: { prefersBorder: true },
      });
      expect(JSON.stringify(resource.contents[0]._meta)).not.toContain(
        'localhost',
      );
      const manifest = JSON.parse(
        await fs.readFile(path.join(output, 'ui-manifest.json'), 'utf8'),
      );
      await fs.writeFile(
        path.resolve(output, manifest.views.local.html),
        '<html><head></head><body>Changed</body></html>',
      );
      expect(
        (await client.readResource({ uri: 'ui://app/local' })).contents[0].text,
      ).toBe(html);
    } finally {
      await client.close();
      await transport.close();
    }
  }, 60_000);
  it('rejects output inside normal dist to avoid dev/build deleting the server', async () => {
    await expect(
      prepareStdio({
        root,
        views: 'tests/fixtures/mcp-views.json',
        stdio: {
          server: 'tests/fixtures/stdio-server.ts',
          output: 'dist/stdio',
        },
      }),
    ).rejects.toThrow('outside the application dist');
  });
  it('rejects MF views rather than shipping a network-dependent offline bundle', async () => {
    await expect(
      prepareStdio({
        root,
        views: 'tests/fixtures/mcp-views-mf.json',
        stdio: { server: 'tests/fixtures/stdio-server.ts' },
      }),
    ).rejects.toThrow('local component views');
  });
});

it('keeps previous output intact when a view exceeds the inline size limit', async () => {
  const directory = await fs.mkdtemp(path.join(root, '.test-large-'));
  const destination = path.join(directory, 'output');
  try {
    await fs.mkdir(destination);
    await fs.writeFile(path.join(destination, 'server.cjs'), 'previous build');
    await fs.writeFile(
      path.join(directory, 'views.json'),
      JSON.stringify({ views: { large: './Large.tsx' } }),
    );
    await fs.writeFile(
      path.join(directory, 'Large.tsx'),
      `export default function Large() { return <div>${'x'.repeat(6 * 1024 * 1024)}</div> }`,
    );
    await expect(
      prepareStdio({
        root,
        views: path.join(directory, 'views.json'),
        stdio: {
          server: 'tests/fixtures/stdio-server.ts',
          output: path.relative(root, destination),
        },
      }),
    ).rejects.toThrow('5 MiB');
    expect(
      await fs.readFile(path.join(destination, 'server.cjs'), 'utf8'),
    ).toBe('previous build');
  } finally {
    await fs.rm(directory, { recursive: true, force: true });
  }
}, 60_000);
