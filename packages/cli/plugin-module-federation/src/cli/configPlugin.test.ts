import { it, expect, describe, rs, afterEach } from '@rstest/core';
import {
  moduleFederationConfigPlugin,
  patchMFConfig,
  setDefaultOptimizationTarget,
  cloneConfig,
  getMFConfig,
} from './configPlugin';
import logger from '../logger';

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
    modifyBundlerChain: rs.fn(),
  } as any);

  return configCallbacks[0]();
};

afterEach(() => {
  rs.restoreAllMocks();
});

describe('patchMFConfig', async () => {
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
      runtimePlugins: [
        require.resolve('@modern-js/plugin-module-federation/shared-strategy'),
        require.resolve('@module-federation/node/runtimePlugin'),
        require.resolve('@modern-js/plugin-module-federation/inject-node-fetch'),
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
      runtimePlugins: [
        require.resolve('@modern-js/plugin-module-federation/shared-strategy'),
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
      dts: {
        consumeTypes: {
          runtimePkgs: ['@modern-js/plugin-module-federation/runtime'],
        },
      },
    });
  });
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
