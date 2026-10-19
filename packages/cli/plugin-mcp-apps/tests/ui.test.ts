import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { expect, it } from '@rstest/core';
import { mcpAppsPlugin } from '../src/cli';

it('builds a portable UI manifest without registering or compiling a BFF server', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'modern-ui-only-'));
  try {
    await writeFile(
      path.join(root, 'package.json'),
      JSON.stringify({ type: 'module' }),
    );
    await writeFile(
      path.join(root, 'mcp_apps.mjs'),
      `export default { tools: [{ name: 'greet', view: { module: './Greeting.tsx' } }] };`,
    );
    const hooks: Record<string, any> = {};
    const plugin = mcpAppsPlugin({ mode: 'ui-only', config: 'mcp_apps.mjs' });
    expect(plugin.required).toEqual([]);
    const config = {
      dev: {},
      output: { assetPrefix: 'https://cdn.example/app/' },
    };
    await plugin.setup!({
      modifyResolvedConfig: (fn: any) => {
        expect(fn({ source: {} })).toEqual({
          source: { disableDefaultEntries: true },
        });
      },
      getAppContext: () => ({
        appDirectory: root,
        internalDirectory: path.join(root, '.modern'),
        distDirectory: path.join(root, 'dist'),
        command: 'build',
      }),
      getNormalizedConfig: () => config,
      onBeforePrintInstructions: () => {},
      modifyEntrypoints: (fn: any) => {
        hooks.entries = fn;
      },
      onAfterCreateCompiler: (fn: any) => {
        hooks.compiler = fn;
      },
      onBeforeRestart: () => {},
      addWatchFiles: () => {},
      onAfterBuild: (fn: any) => {
        hooks.build = fn;
      },
      _internalServerPlugins: () => {
        throw new Error('UI-only must not register a server plugin');
      },
    } as any);
    const { entrypoints } = await hooks.entries({ entrypoints: [] });
    expect(entrypoints).toHaveLength(1);
    expect(await readFile(entrypoints[0].entry, 'utf8')).toContain(
      'createMcpView',
    );
    const name = entrypoints[0].entryName;
    hooks.compiler({
      compiler: {
        name: 'client',
        hooks: {
          afterEmit: {
            tapPromise: (_: string, fn: any) => {
              hooks.emit = fn;
            },
          },
        },
      },
      environments: {
        client: {
          config: { output: { target: 'web' } },
          htmlPaths: { [name]: `${name}.html` },
        },
      },
    });
    await hooks.emit({
      errors: [],
      getAsset: () => ({
        source: { source: () => '<html><head></head></html>' },
      }),
    });
    const manifest = JSON.parse(
      await readFile(path.join(root, 'dist/mcp-apps/ui-manifest.json'), 'utf8'),
    );
    expect(manifest.version).toBe(1);
    expect(manifest.tools.greet).toMatchObject({
      resourceUri: 'ui://local/greet',
      html: `./ui/${name}.html`,
      assetBase: 'https://cdn.example/app/',
    });
    expect(
      await readFile(
        path.join(root, 'dist/mcp-apps', manifest.tools.greet.html),
        'utf8',
      ),
    ).toContain('<html>');
    await hooks.build();
    await expect(
      readFile(path.join(root, 'dist/mcp_apps.mjs')),
    ).rejects.toThrow();
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
