import {
  mkdtemp,
  mkdir,
  symlink,
  readFile,
  rm,
  writeFile,
} from 'node:fs/promises';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { expect, it } from '@rstest/core';
import { mcpAppsPlugin } from '../src/cli';

for (const mode of ['build', 'dev', 'disabled']) {
  it(`builds portable UI resources in ${mode} without a BFF server`, async () => {
    const command = mode === 'build' ? 'build' : 'dev';
    const root = await mkdtemp(path.join(os.tmpdir(), 'modern-ui-only-'));
    try {
      await mkdir(path.join(root, 'node_modules/@modern-js'), {
        recursive: true,
      });
      await symlink(
        fileURLToPath(new URL('../../../toolkit/mcp-apps', import.meta.url)),
        path.join(root, 'node_modules/@modern-js/mcp-apps'),
        'dir',
      );
      await writeFile(
        path.join(root, 'package.json'),
        JSON.stringify({ type: 'module' }),
      );
      await writeFile(
        path.join(root, 'mcp_apps.mjs'),
        `export default { tools: [{ name: 'greet', view: { module: './Greeting.tsx' } }] };`,
      );
      const hooks: Record<string, any> = {};
      const plugin = mcpAppsPlugin({
        mode: 'ui-only',
        config: 'mcp_apps.mjs',
        debug: mode !== 'disabled',
      });
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
          command,
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
      expect(entrypoints).toHaveLength(mode === 'dev' ? 2 : 1);
      expect(
        entrypoints.some((entry: any) => entry.entryName === '__mcp_debug'),
      ).toBe(mode === 'dev');
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
        await readFile(
          path.join(
            root,
            command === 'build' ? 'dist' : '.modern',
            'mcp-apps/ui-manifest.json',
          ),
          'utf8',
        ),
      );
      expect(manifest.version).toBe(1);
      expect(manifest.tools.greet).toMatchObject({
        resourceUri: 'ui://local/greet',
        html: `./ui/${name}.html`,
        assetBase: command === 'build' ? 'https://cdn.example/app/' : 'request',
      });
      expect(
        await readFile(
          path.join(
            root,
            command === 'build' ? 'dist' : '.modern',
            'mcp-apps',
            manifest.tools.greet.html,
          ),
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
}
