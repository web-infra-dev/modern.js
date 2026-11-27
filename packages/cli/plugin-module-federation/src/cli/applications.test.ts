import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it, rs } from '@rstest/core';
import { moduleFederationConfigPlugin } from './configPlugin';
import { builtinModuleFederationPlugin } from './index';

const directories: string[] = [];
function createTempApp() {
  const dir = mkdtempSync(path.join(tmpdir(), 'modern-mf-apps-'));
  directories.push(dir);
  return dir;
}

afterEach(() => {
  for (const dir of directories.splice(0)) {
    rmSync(dir, { recursive: true, force: true });
  }
});

describe('moduleFederation.applications public CLI setup', () => {
  it('requires moduleFederation.name when activating applications without module-federation.config.ts', async () => {
    const dir = createTempApp();
    const plugin = builtinModuleFederationPlugin();
    const api = {
      getConfig: () => ({
        moduleFederation: {
          applications: { hooks: './applications.ts' },
        },
      }),
      getAppContext: () => ({
        appDirectory: dir,
        distDirectory: path.join(dir, 'dist'),
        metaName: 'modern-js',
      }),
      isPluginExists: () => false,
      addWatchFiles: rs.fn(),
    } as any;

    await expect(plugin.setup!(api)).rejects.toThrow(
      /moduleFederation\.name is required/,
    );
  });

  it('registers runtime plugin wrapper and dynamic service plugin when applications.hooks is configured', async () => {
    const dir = createTempApp();
    writeFileSync(
      path.join(dir, 'applications.ts'),
      'export default async function load() { return { routes: [] }; }\n',
    );

    const runtimePlugins: any[] = [];
    const serverPlugins: any[] = [];
    const watched: string[] = [];

    const configPlugin = moduleFederationConfigPlugin({
      originPluginOptions: {
        name: 'portal',
        config: { name: 'portal' },
        applications: {
          hooks: './applications',
          autoGenerateRoute: false,
          maxDepth: 4,
        },
      },
      userConfig: {
        name: 'portal',
        config: { name: 'portal' },
        applications: {
          hooks: './applications',
          autoGenerateRoute: false,
          maxDepth: 4,
        },
      },
      distOutputDir: '',
      assetFileNames: {},
      assetResources: {},
    });

    const api = {
      getConfig: () => ({}),
      getAppContext: () => ({
        appDirectory: dir,
        distDirectory: path.join(dir, 'dist'),
        internalDirectory: path.join(dir, '.modern-js'),
        metaName: 'modern-js',
      }),
      addWatchFiles: (fn: () => string[]) => watched.push(...fn()),
      _internalRuntimePlugins: (fn: (arg: any) => any) => {
        const res = fn({ entrypoint: { entryName: 'index' }, plugins: [] });
        runtimePlugins.push(...res.plugins);
      },
      _internalServerPlugins: (fn: (arg: any) => any) => {
        const res = fn({ plugins: [] });
        serverPlugins.push(...res.plugins);
      },
      modifyBundlerChain: rs.fn(),
      config: rs.fn(),
      onAfterBuild: rs.fn(),
      onDevCompileDone: rs.fn(),
      isPluginExists: () => false,
    } as any;

    await configPlugin.setup!(api);

    expect(watched).toContain(path.join(dir, 'applications.ts'));
    const appRuntimePlugin = runtimePlugins.find(
      item => item.name === 'mfApplications',
    );
    expect(appRuntimePlugin).toBeDefined();
    expect(appRuntimePlugin.config).toEqual({
      autoGenerateRoute: false,
      maxDepth: 4,
    });
    const content = readFileSync(appRuntimePlugin.path, 'utf8');
    expect(content).toContain(`import * as hooks from`);
    expect(content).toContain(`@modern-js/runtime/mf`);
    expect(content).toContain(`export const mfApplicationsPlugin`);

    // Service server plugin must be auto-registered with allowDynamicRemotes: true
    const serviceServerPlugin = serverPlugins.find(item =>
      String(item.name).includes('servicePlugin'),
    );
    expect(serviceServerPlugin?.options?.allowDynamicRemotes).toBe(true);
  });

  it('throws a clear error when applications.hooks points to a missing file', async () => {
    const dir = createTempApp();
    const configPlugin = moduleFederationConfigPlugin({
      originPluginOptions: {
        name: 'portal',
        config: { name: 'portal' },
        applications: { hooks: './missing-hooks' },
      },
      userConfig: {
        name: 'portal',
        config: { name: 'portal' },
        applications: { hooks: './missing-hooks' },
      },
      distOutputDir: '',
      assetFileNames: {},
      assetResources: {},
    });

    const api = {
      getConfig: () => ({}),
      getAppContext: () => ({
        appDirectory: dir,
        distDirectory: path.join(dir, 'dist'),
        metaName: 'modern-js',
      }),
      addWatchFiles: rs.fn(),
      _internalRuntimePlugins: rs.fn(),
      _internalServerPlugins: rs.fn(),
      modifyBundlerChain: rs.fn(),
      config: rs.fn(),
      onAfterBuild: rs.fn(),
      onDevCompileDone: rs.fn(),
      isPluginExists: () => false,
    } as any;

    await expect(configPlugin.setup!(api)).rejects.toThrow(
      /Applications hooks module not found/,
    );
  });
});
