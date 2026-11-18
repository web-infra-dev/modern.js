import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it, rs } from '@rstest/core';
import { createBuilder } from '../src';
import { parseConfig } from '../src/createBuilder';
import { pluginEmitRouteFile } from '../src/plugins/emitRouteFile';
import { generateManifest } from '../src/shared/manifest';
import { unwrapConfig } from './helper';

const cwd = join(__dirname, '..');

afterEach(() => {
  rs.unstubAllEnvs();
});

describe('builder compatibility adapters', () => {
  it('preserves the public asset manifest schema and excludes maps from entrypoints', () => {
    const files = [
      { name: 'main.js', path: '/assets/main.js' },
      { name: 'main.js.map', path: '/assets/main.js.map' },
      { name: 'secondary.js', path: '/assets/secondary.js' },
    ];
    expect(
      generateManifest!({ 'seed.css': '/assets/seed.css' }, files as any, {
        main: ['main.js', 'main.js.map'],
        secondary: ['secondary.js', 'secondary.js.map'],
      }),
    ).toEqual({
      files: {
        'seed.css': '/assets/seed.css',
        'main.js': '/assets/main.js',
        'main.js.map': '/assets/main.js.map',
        'secondary.js': '/assets/secondary.js',
      },
      entrypoints: ['main.js', 'secondary.js'],
    });
  });

  it('only registers asset manifests when requested', async () => {
    const disabled = await parseConfig({}, { cwd });
    const enabled = await parseConfig(
      { output: { enableAssetManifest: true } },
      { cwd },
    );
    expect(
      disabled.rsbuildPlugins.some(
        plugin => plugin.name === 'builder:manifest',
      ),
    ).toBe(false);
    expect(
      enabled.rsbuildPlugins.some(plugin => plugin.name === 'builder:manifest'),
    ).toBe(true);
  });

  it('translates legacy SRI enablement and the first requested algorithm', async () => {
    expect(
      (await parseConfig({ security: { sri: true } }, { cwd })).rsbuildConfig
        .security?.sri,
    ).toEqual({ enable: 'auto' });
    expect(
      (
        await parseConfig(
          {
            security: {
              sri: { enabled: true, hashFuncNames: ['sha384', 'sha512'] },
            },
          },
          { cwd },
        )
      ).rsbuildConfig.security?.sri,
    ).toEqual({ enable: true, algorithm: 'sha384' });
    expect(
      (
        await parseConfig(
          { security: { sri: { enabled: false, hashFuncNames: ['sha256'] } } },
          { cwd },
        )
      ).rsbuildConfig.security?.sri,
    ).toEqual({ enable: false, algorithm: 'sha256' });
  });

  it('extracts and inlines the named runtime by default, respecting explicit opt-outs', async () => {
    rs.stubEnv('NODE_ENV', 'production');
    const defaults = await createBuilder({
      bundlerType: 'rspack',
      config: {},
      cwd,
    });
    const config = await unwrapConfig(defaults);
    expect(config.optimization?.runtimeChunk).toEqual({
      name: 'builder-runtime',
    });
    const inline = defaults.getRsbuildConfig().output?.inlineScripts as RegExp;
    expect(inline).toBeInstanceOf(RegExp);
    expect(inline.test('builder-runtime.js')).toBe(true);
    expect(inline.test('main.js')).toBe(false);

    const disabled = await createBuilder({
      bundlerType: 'rspack',
      config: {
        splitChunks: false,
        output: { disableInlineRuntimeChunk: true },
      },
      cwd,
    });
    expect(
      (await unwrapConfig(disabled)).optimization?.runtimeChunk,
    ).toBeFalsy();
    expect(disabled.getRsbuildConfig().output?.inlineScripts).toBeFalsy();

    const explicit = /custom-runtime\.js$/;
    const user = await createBuilder({
      bundlerType: 'rspack',
      config: { output: { inlineScripts: explicit } },
      cwd,
    });
    await unwrapConfig(user);
    expect(user.getRsbuildConfig().output?.inlineScripts).toEqual(explicit);
  });

  it('writes the SPA fallback route schema without overwriting a framework route file', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'modern-builder-routes-'));
    try {
      let beforeStart: ((context: any) => Promise<void>) | undefined;
      // Supply the external Rsbuild lifecycle boundary, not mocked internal modules.
      pluginEmitRouteFile().setup({
        context: { distPath: directory },
        onBeforeStartDevServer(handler: typeof beforeStart) {
          beforeStart = handler;
        },
      } as any);
      const context = {
        environments: {
          client: {
            htmlPaths: {
              main: 'html/main/index.html',
              admin: 'html/admin/index.html',
            },
          },
        },
      };
      await beforeStart!(context);
      const file = join(directory, 'route.json');
      expect(JSON.parse(await readFile(file, 'utf8'))).toEqual({
        routes: [
          {
            urlPath: '/',
            entryName: 'main',
            entryPath: 'html/main/index.html',
            isSPA: true,
          },
          {
            urlPath: '/admin',
            entryName: 'admin',
            entryPath: 'html/admin/index.html',
            isSPA: true,
          },
        ],
      });
      const existing = '{"routes":[{"urlPath":"/framework"}]}';
      await writeFile(file, existing);
      await beforeStart!(context);
      expect(await readFile(file, 'utf8')).toBe(existing);
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });
});
