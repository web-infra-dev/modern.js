import { it, expect, describe, rs, afterEach } from '@rstest/core';
import {
  moduleFederationConfigPlugin,
  patchMFConfig,
  setDefaultOptimizationTarget,
  cloneConfig,
  getMFConfig,
} from './configPlugin';
import { logger } from '@modern-js/utils';
import { createInstance } from '@module-federation/enhanced/runtime';
import * as originalUtils from './utils' with { rstest: 'importActual' };

rs.mock('./utils', () => ({
  ...originalUtils,
  resolveInternalPlugin: (relativePath: string) => `/built/${relativePath}`,
}));

const mfConfig = {
  name: 'host',
  filename: 'remoteEntry.js',
  remotes: {
    remote: 'http://localhost:3000/remoteEntry.js',
  },
  shared: {
    react: { singleton: true, eager: true },
    'react-dom': { singleton: true, eager: true },
  },
};

const getModernJsConfig = async (
  moduleFederationConfig: Record<string, unknown>,
  modernjsConfig: Record<string, unknown> = {},
) => {
  const configCallbacks: Array<() => unknown> = [];
  const plugin = moduleFederationConfigPlugin({
    originPluginOptions: {
      config: moduleFederationConfig,
    },
    userConfig: {},
  } as any);

  await plugin.setup!({
    config: rs.fn(callback => {
      configCallbacks.push(callback);
    }),
    getConfig: rs.fn(() => modernjsConfig),
    getAppContext: rs.fn(() => ({ metaName: 'modern-js' })),
    modifyBundlerChain: rs.fn(),
  } as any);

  return configCallbacks[0]();
};

afterEach(() => {
  rs.restoreAllMocks();
});

describe('patchMFConfig', async () => {
  it('registers framework provider imports without enabling router aliases', () => {
    const config: any = {
      name: 'producer',
      manifest: {
        filePath: 'static',
        bridgeProviderModules: ['custom-provider'],
      },
    };
    patchMFConfig(config, false, '@custom/runtime/mf');
    patchMFConfig(config, false, '@custom/runtime/mf');
    expect(config.manifest).toEqual({
      filePath: 'static',
      bridgeProviderModules: ['custom-provider', '@custom/runtime/mf'],
    });
    expect(config.bridge.enableBridgeRouter).toBe(false);
    const disabled: any = { name: 'producer', manifest: false };
    patchMFConfig(disabled, false, '@custom/runtime/mf');
    expect(disabled.manifest).toBe(false);
  });

  it('uses the app metadata name for the framework runtime alias', async () => {
    const callbacks: Array<() => any> = [];
    const plugin = moduleFederationConfigPlugin({
      originPluginOptions: { config: { name: 'host' } },
      userConfig: {},
    } as any);
    await plugin.setup!({
      getConfig: () => ({}),
      getAppContext: () => ({ metaName: 'custom' }),
      modifyBundlerChain: rs.fn(),
      config: (callback: () => any) => callbacks.push(callback),
    } as any);
    expect(callbacks[0]().resolve.alias).toEqual({
      '@custom/runtime/mf$': expect.stringContaining('runtime/mf'),
    });
  });
  it('patchMFConfig: server', async () => {
    const patchedConfig = JSON.parse(JSON.stringify(mfConfig));
    patchMFConfig(patchedConfig, true);

    expect(patchedConfig).toStrictEqual({
      bridge: { enableBridgeRouter: false },
      dev: false,
      dts: false,
      filename: 'remoteEntry.js',
      library: {
        name: 'host',
        type: 'commonjs-module',
      },
      name: 'host',
      remotes: {
        remote: `http://localhost:3000/remoteEntry.js`,
      },
      remoteType: 'script',
      shareStrategy: 'loaded-first',
      runtimePlugins: [
        require.resolve('@module-federation/node/runtimePlugin'),
      ],
      shared: {
        react: {
          eager: true,
          singleton: true,
        },
        'react-dom': {
          eager: true,
          singleton: true,
        },
      },
    });
  });

  it('patchMFConfig: client', async () => {
    const patchedConfig = JSON.parse(JSON.stringify(mfConfig));
    patchMFConfig(patchedConfig, false);

    expect(patchedConfig).toStrictEqual({
      bridge: { enableBridgeRouter: false },
      filename: 'remoteEntry.js',
      name: 'host',
      remotes: {
        remote: `http://localhost:3000/remoteEntry.js`,
      },
      remoteType: 'script',
      shareStrategy: 'loaded-first',
      runtimePlugins: [],
      shared: {
        react: {
          eager: true,
          singleton: true,
        },
        'react-dom': {
          eager: true,
          singleton: true,
        },
      },
    });
  });
});

describe('shared strategy configuration', () => {
  it.each([false, true])(
    'preserves an explicit strategy (server: %s)',
    isServer => {
      const config = {
        name: 'explicit-strategy',
        shareStrategy: 'version-first' as const,
        runtimePlugins: ['custom-runtime-plugin'],
      };
      patchMFConfig(config, isServer);
      expect(config.shareStrategy).toBe('version-first');
      expect(config.runtimePlugins).toContain('custom-runtime-plugin');
    },
  );

  it.each([false, true])(
    'passes the default strategy to runtime shared entries (server: %s)',
    isServer => {
      const config = { name: `default-strategy-${isServer}` };
      const patched = patchMFConfig(config, isServer);
      const instance = createInstance({
        name: config.name,
        shareStrategy: patched.shareStrategy,
        shared: {
          inherited: { version: '1.0.0', lib: () => ({}) },
          explicit: {
            version: '1.0.0',
            lib: () => ({}),
            strategy: 'version-first',
          },
        },
      });
      expect(instance.options.shareStrategy).toBe('loaded-first');
      expect(instance.options.shared.inherited[0].strategy).toBe(
        'loaded-first',
      );
      expect(instance.options.shared.explicit[0].strategy).toBe(
        'version-first',
      );
    },
  );
});

describe('setDefaultOptimizationTarget', () => {
  it('defaults to web when SSR is disabled', () => {
    const config = { name: 'host' };

    setDefaultOptimizationTarget(config, false, false);

    expect(config).toMatchObject({
      experiments: { optimization: { target: 'web' } },
    });
  });

  it('defaults to web for the browser target when SSR is enabled', () => {
    const config = { name: 'host' };

    setDefaultOptimizationTarget(config, true, false);

    expect(config).toMatchObject({
      experiments: { optimization: { target: 'web' } },
    });
  });

  it('defaults to node for the server target when SSR is enabled', () => {
    const config = { name: 'host' };

    setDefaultOptimizationTarget(config, true, true);

    expect(config).toMatchObject({
      experiments: { optimization: { target: 'node' } },
    });
  });

  it('preserves an explicitly configured target', () => {
    const config = {
      name: 'host',
      experiments: { optimization: { target: 'web' as const } },
    };

    setDefaultOptimizationTarget(config, true, true);

    expect(config.experiments.optimization.target).toBe('web');
  });

  it('does not set a target when autoOptimization is disabled', () => {
    const config = { name: 'host' };

    setDefaultOptimizationTarget(config, true, true, false);

    expect(config).toStrictEqual({ name: 'host' });
  });
});

describe('moduleFederationConfigPlugin', async () => {
  it('disables lazyCompilation when the project is a producer', async () => {
    const warnSpy = rs.spyOn(logger, 'warn').mockImplementation(() => {});
    const modernJsConfig = await getModernJsConfig(
      {
        name: 'remote',
        exposes: {
          './Button': './src/Button',
        },
      },
      {
        tools: {
          devServer: {
            headers: {},
          },
        },
      },
    );

    expect(modernJsConfig).toMatchObject({
      dev: {
        assetPrefix: 'auto',
        lazyCompilation: false,
      },
    });
    expect(warnSpy).toHaveBeenCalledWith(
      'Detected exposes in the Module Federation config. The Modern.js v3 Module Federation plugin will set dev.lazyCompilation to false for producer apps.',
    );
  });

  it('keeps lazyCompilation unchanged when the project is not a producer', async () => {
    const warnSpy = rs.spyOn(logger, 'warn').mockImplementation(() => {});
    const modernJsConfig = await getModernJsConfig(
      {
        name: 'host',
        remotes: {
          remote: 'http://localhost:3000/remoteEntry.js',
        },
      },
      {
        dev: {
          assetPrefix: 'http://localhost:3001/',
          lazyCompilation: true,
        },
      },
    );

    expect(modernJsConfig).toMatchObject({
      dev: {
        assetPrefix: 'http://localhost:3001/',
        lazyCompilation: true,
      },
    });
    expect(warnSpy).not.toHaveBeenCalled();
  });
});

describe('configuration fidelity', () => {
  it('clones client/server containers without losing function-valued options', () => {
    const getPublicPath = () => 'https://cdn.example.com/';
    const config = {
      name: 'test',
      getPublicPath,
      shared: { react: { singleton: true } },
      runtimePlugins: [['plugin', { nested: true }]],
    };
    const client = cloneConfig(config);
    const server = cloneConfig(config);
    client.shared.react.singleton = false;
    expect(server.shared.react.singleton).toBe(true);
    expect(config.shared.react.singleton).toBe(true);
    expect(client.getPublicPath).toBe(getPublicPath);
    expect(server.runtimePlugins).not.toBe(client.runtimePlugins);
  });
  it('prefers inline configuration over a file', async () => {
    const config = {
      name: 'inline',
      getPublicPath: 'function() { return "/"; }',
    };
    expect(await getMFConfig({ config, configPath: '/missing.ts' })).toBe(
      config,
    );
  });
});

it('preserves an explicitly configured Bridge router integration', () => {
  const config = { name: 'bridge', bridge: { enableBridgeRouter: true } };
  patchMFConfig(config, false);
  expect(config.bridge.enableBridgeRouter).toBe(true);
});

describe('resolved output directories', () => {
  it.each([
    {
      target: 'node',
      outputPath: '/final/server-output',
      distPath: { root: 'build', server: 'ssr' },
      expected: '/final/server-output',
    },
    {
      target: 'node',
      outputPath: undefined,
      distPath: { root: 'build', server: 'ssr' },
      expected: '/project/build/ssr',
    },
    {
      target: 'node',
      outputPath: undefined,
      distPath: { root: '/external/build', server: 'server-render' },
      expected: '/external/build/server-render',
    },
    {
      target: 'node',
      outputPath: undefined,
      distPath: {},
      expected: '/project/dist/bundles',
    },
    {
      target: 'web',
      outputPath: undefined,
      distPath: { root: 'build', server: 'ssr' },
      expected: '/project/build',
    },
  ])(
    'uses $expected for $target output',
    async ({ target, outputPath, distPath, expected }) => {
      const options = {
        originPluginOptions: { config: { name: 'output-path', dts: false } },
        userConfig: {},
      } as any;
      const modifyBundlerChain = rs.fn();
      await moduleFederationConfigPlugin(options).setup!({
        getConfig: () => ({ server: { ssr: true }, output: { distPath } }),
        getAppContext: () => ({
          appDirectory: '/project',
          distDirectory: distPath.root?.startsWith('/')
            ? distPath.root
            : `/project/${distPath.root || 'dist'}`,
          port: 8080,
        }),
        config: rs.fn(),
        modifyBundlerChain,
      } as any);
      const chain = {
        get: (key: string) => (key === 'target' ? target : undefined),
        watchOptions: rs.fn(),
        ignoreWarnings: rs.fn(),
        optimization: { delete: rs.fn(), splitChunks: { entries: () => ({}) } },
        output: {
          get: (key: string) => (key === 'path' ? outputPath : undefined),
          chunkLoadingGlobal: rs.fn(),
          uniqueName: rs.fn(),
        },
      };
      modifyBundlerChain.mock.calls[0][0](chain);
      expect(
        target === 'web'
          ? options.distOutputDir
          : options.userConfig.ssr.distOutputDir,
      ).toBe(expected);
    },
  );
});

it('uses the actual development port selected by Modern instead of the requested port', async () => {
  rs.stubEnv('NODE_ENV', 'development');
  try {
    const modifyBundlerChain = rs.fn();
    await moduleFederationConfigPlugin({
      originPluginOptions: { config: { name: 'port-test', dts: false } },
      userConfig: {},
    } as any).setup!({
      getConfig: () => ({ server: { port: 8080 } }),
      getAppContext: () => ({ port: 8081, distDirectory: '/project/build' }),
      config: rs.fn(),
      modifyBundlerChain,
    } as any);
    const publicPath = rs.fn();
    modifyBundlerChain.mock.calls[0][0]({
      get: (key: string) => (key === 'target' ? 'web' : undefined),
      watchOptions: rs.fn(),
      ignoreWarnings: rs.fn(),
      optimization: { delete: rs.fn(), splitChunks: { entries: () => ({}) } },
      output: {
        get: (key: string) => (key === 'publicPath' ? 'auto' : undefined),
        chunkLoadingGlobal: rs.fn(),
        uniqueName: rs.fn(),
        publicPath,
      },
    });
    expect(publicPath).toHaveBeenCalledWith('http://localhost:8081/');
  } finally {
    rs.unstubAllEnvs();
  }
});

it('preserves explicit DTS options without adding an adapter runtime facade', () => {
  const dts = { consumeTypes: { runtimePkgs: ['custom-runtime'] } };
  const config = { name: 'dts-test', dts };
  patchMFConfig(config, false);
  expect(config.dts).toEqual({
    consumeTypes: { runtimePkgs: ['custom-runtime'] },
  });
});
