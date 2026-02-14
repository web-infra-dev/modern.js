import path from 'path';

const HOST_MODERN_CONFIG_MODULE = '../host/modern.config';
const REMOTE_MODERN_CONFIG_MODULE = '../remote/modern.config';

const withEnv = <T>(
  env: Partial<Record<'PORT' | 'RSC_MF_REMOTE_PORT', string>>,
  run: () => T,
): T => {
  const previousPort = process.env.PORT;
  const previousRemotePort = process.env.RSC_MF_REMOTE_PORT;

  if (typeof env.PORT === 'undefined') {
    delete process.env.PORT;
  } else {
    process.env.PORT = env.PORT;
  }
  if (typeof env.RSC_MF_REMOTE_PORT === 'undefined') {
    delete process.env.RSC_MF_REMOTE_PORT;
  } else {
    process.env.RSC_MF_REMOTE_PORT = env.RSC_MF_REMOTE_PORT;
  }

  try {
    return run();
  } finally {
    if (typeof previousPort === 'undefined') {
      delete process.env.PORT;
    } else {
      process.env.PORT = previousPort;
    }
    if (typeof previousRemotePort === 'undefined') {
      delete process.env.RSC_MF_REMOTE_PORT;
    } else {
      process.env.RSC_MF_REMOTE_PORT = previousRemotePort;
    }
  }
};

const loadHostConfig = () =>
  withEnv({}, () => {
    jest.resetModules();
    jest.doMock('@modern-js/app-tools', () => ({
      appTools: () => ({ name: 'app-tools-mock' }),
      defineConfig: (config: unknown) => config,
    }));
    jest.doMock('@module-federation/modern-js-v3', () => ({
      moduleFederationPlugin: (options: unknown) => ({
        name: 'mf-plugin-mock',
        options,
      }),
    }));

    let config: any;
    jest.isolateModules(() => {
      config = require(HOST_MODERN_CONFIG_MODULE).default;
    });
    return config;
  });

const loadRemoteConfig = ({
  port,
  remotePort,
}: {
  port?: string;
  remotePort?: string;
}) =>
  withEnv(
    {
      PORT: port,
      RSC_MF_REMOTE_PORT: remotePort,
    },
    () => {
      jest.resetModules();
      jest.doMock('@modern-js/app-tools', () => ({
        appTools: () => ({ name: 'app-tools-mock' }),
        defineConfig: (config: unknown) => config,
      }));
      jest.doMock('@module-federation/modern-js-v3', () => ({
        moduleFederationPlugin: (options: unknown) => ({
          name: 'mf-plugin-mock',
          options,
        }),
      }));

      let config: any;
      jest.isolateModules(() => {
        config = require(REMOTE_MODERN_CONFIG_MODULE).default;
      });
      return config;
    },
  );

const createChainHarness = (target: string | string[]) => {
  const aliasMap = new Map<string, string>();
  const conditionNames: string[] = [];
  const moduleDirectories: string[] = [];
  const publicPathCalls: string[] = [];
  const chunkLoadingGlobalCalls: string[] = [];
  const splitChunksCalls: unknown[] = [];
  const targetCalls: string[] = [];
  const rules: Array<{ name: string; test?: RegExp; layer?: string }> = [];

  const aliasApi = {
    set: (key: string, value: string) => {
      aliasMap.set(key, value);
      return aliasApi;
    },
  };
  const conditionNamesApi = {
    clear: () => {
      conditionNames.length = 0;
      return conditionNamesApi;
    },
    add: (value: string) => {
      conditionNames.push(value);
      return conditionNamesApi;
    },
  };
  const modulesApi = {
    clear: () => {
      moduleDirectories.length = 0;
      return modulesApi;
    },
    add: (value: string) => {
      moduleDirectories.push(value);
      return modulesApi;
    },
  };

  const chain = {
    get: (key: string) => (key === 'target' ? target : undefined),
    target: (value: string) => {
      targetCalls.push(value);
      return chain;
    },
    resolve: {
      alias: aliasApi,
      conditionNames: conditionNamesApi,
      modules: modulesApi,
    },
    output: {
      publicPath: (value: string) => {
        publicPathCalls.push(value);
        return chain.output;
      },
      chunkLoadingGlobal: (value: string) => {
        chunkLoadingGlobalCalls.push(value);
        return chain.output;
      },
    },
    optimization: {
      splitChunks: (value: unknown) => {
        splitChunksCalls.push(value);
        return chain.optimization;
      },
    },
    module: {
      rule: (name: string) => {
        const rule = { name } as {
          name: string;
          test?: RegExp;
          layer?: string;
        };
        rules.push(rule);
        return {
          test: (value: RegExp) => {
            rule.test = value;
            return {
              layer: (layerValue: string) => {
                rule.layer = layerValue;
                return chain.module;
              },
            };
          },
        };
      },
    },
  };

  return {
    chain,
    aliasMap,
    conditionNames,
    moduleDirectories,
    publicPathCalls,
    chunkLoadingGlobalCalls,
    splitChunksCalls,
    targetCalls,
    rules,
  };
};

describe('rsc-mf modern config contracts', () => {
  it('keeps host modern server and source contracts', () => {
    const hostConfig = loadHostConfig();
    expect(hostConfig.server).toEqual(
      expect.objectContaining({
        rsc: true,
        port: 3007,
      }),
    );
    expect(hostConfig.source).toEqual(
      expect.objectContaining({
        enableAsyncEntry: false,
      }),
    );
    expect(hostConfig.source).not.toHaveProperty('preEntry');
    expect(hostConfig.plugins).toHaveLength(2);
    expect(hostConfig.plugins).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'app-tools-mock' }),
        expect.objectContaining({
          name: 'mf-plugin-mock',
          options: expect.objectContaining({ ssr: true }),
        }),
      ]),
    );
  });

  it('applies host async-node bundler behavior for node targets', () => {
    const hostConfig = loadHostConfig();
    const harness = createChainHarness('node');
    hostConfig.tools?.bundlerChain?.(harness.chain as any);

    expect(harness.targetCalls).toContain('async-node');
    expect(harness.conditionNames).toEqual(['require', 'import', 'default']);
    expect(harness.aliasMap.get('server-only$')).toMatch(
      /server-only[\\/]empty\.js$/,
    );
    expect(harness.moduleDirectories).toEqual([
      path.resolve(__dirname, '../host/node_modules'),
      'node_modules',
    ]);
  });

  it('keeps host web-target bundler chain free of node-only aliases', () => {
    const hostConfig = loadHostConfig();
    const harness = createChainHarness('web');
    hostConfig.tools?.bundlerChain?.(harness.chain as any);

    expect(harness.targetCalls).toEqual([]);
    expect(harness.aliasMap.has('server-only$')).toBe(false);
    expect(harness.conditionNames).toEqual([]);
    expect(harness.moduleDirectories).toEqual([
      path.resolve(__dirname, '../host/node_modules'),
      'node_modules',
    ]);
  });

  it('configures remote port-driven server and asset settings', () => {
    const remoteConfig = loadRemoteConfig({
      remotePort: '3991',
    });

    expect(remoteConfig.server).toEqual(
      expect.objectContaining({
        rsc: true,
        ssr: false,
        port: 3991,
      }),
    );
    expect(remoteConfig.output).toEqual(
      expect.objectContaining({
        assetPrefix: 'http://127.0.0.1:3991',
      }),
    );
    expect(remoteConfig.source).toEqual(
      expect.objectContaining({
        enableAsyncEntry: false,
      }),
    );
    expect(remoteConfig.plugins).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'app-tools-mock' }),
        expect.objectContaining({
          name: 'mf-plugin-mock',
          options: expect.objectContaining({ ssr: true }),
        }),
      ]),
    );
  });

  it('enables remote ssr mode when explicit PORT is set', () => {
    const remoteConfig = loadRemoteConfig({
      port: '4550',
    });
    expect(remoteConfig.server).toEqual(
      expect.objectContaining({
        ssr: true,
        port: 4550,
      }),
    );
  });

  it('keeps remote port precedence deterministic when PORT and remote port are both set', () => {
    const remoteConfig = loadRemoteConfig({
      port: '4550',
      remotePort: '3881',
    });
    expect(remoteConfig.server).toEqual(
      expect.objectContaining({
        ssr: true,
        port: 3881,
      }),
    );
    expect(remoteConfig.output).toEqual(
      expect.objectContaining({
        assetPrefix: 'http://127.0.0.1:3881',
      }),
    );
  });

  it('applies remote async-node + layer settings for node targets', () => {
    const remoteConfig = loadRemoteConfig({
      remotePort: '3777',
    });
    const harness = createChainHarness('node');
    remoteConfig.tools?.bundlerChain?.(harness.chain as any);

    expect(harness.targetCalls).toContain('async-node');
    expect(harness.conditionNames).toEqual(['require', 'import', 'default']);
    expect(harness.aliasMap.get('server-only$')).toMatch(
      /server-only[\\/]empty\.js$/,
    );
    expect(harness.aliasMap.get('react/jsx-runtime$')).toMatch(
      /react[\\/]jsx-runtime\.react-server\.js$/,
    );
    expect(harness.aliasMap.get('react/jsx-dev-runtime$')).toMatch(
      /react[\\/]jsx-dev-runtime\.react-server\.js$/,
    );
    expect(
      harness.aliasMap.get('rsc-mf-react-server-dom-client-browser$'),
    ).toContain('react-server-dom-rspack');
    expect(harness.publicPathCalls).toContain('http://127.0.0.1:3777/bundles/');
    expect(harness.chunkLoadingGlobalCalls).toEqual([]);
    expect(harness.rules).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: 'rsc-mf-remote-components-layer',
          layer: 'react-server-components',
        }),
      ]),
    );
    expect(harness.moduleDirectories).toEqual([
      path.resolve(__dirname, '../remote/node_modules'),
      'node_modules',
    ]);
  });

  it('applies remote client split-chunk + publicPath settings for web targets', () => {
    const remoteConfig = loadRemoteConfig({
      remotePort: '3888',
    });
    const harness = createChainHarness('web');
    remoteConfig.tools?.bundlerChain?.(harness.chain as any);

    expect(harness.targetCalls).toEqual([]);
    expect(harness.splitChunksCalls).toEqual([false]);
    expect(harness.publicPathCalls).toContain('http://127.0.0.1:3888/');
    expect(harness.chunkLoadingGlobalCalls).toEqual([]);
    expect(
      harness.aliasMap.get('rsc-mf-react-server-dom-client-browser$'),
    ).toContain('react-server-dom-rspack');
  });
});
