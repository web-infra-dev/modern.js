import { describe, expect, it } from 'vitest';
import { patchMFConfig } from './configPlugin';
import { getIPV4 } from './utils';

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
describe('patchMFConfig', async () => {
  it('patchMFConfig: server', async () => {
    const patchedConfig = JSON.parse(JSON.stringify(mfConfig));
    patchMFConfig(patchedConfig, true);
    const ipv4 = getIPV4();

    expect(patchedConfig).toStrictEqual({
      dev: false,
      dts: false,
      filename: 'remoteEntry.js',
      library: {
        name: 'host',
        type: 'commonjs-module',
      },
      name: 'host',
      remotes: {
        remote: `http://${ipv4}:3000/remoteEntry.js`,
      },
      remoteType: 'script',
      runtimePlugins: [
        require.resolve('@module-federation/modern-js-v3/shared-strategy'),
        require.resolve('@module-federation/node/runtimePlugin'),
        require.resolve('@module-federation/modern-js-v3/inject-node-fetch'),
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
    const ipv4 = getIPV4();

    expect(patchedConfig).toStrictEqual({
      filename: 'remoteEntry.js',
      name: 'host',
      remotes: {
        remote: `http://${ipv4}:3000/remoteEntry.js`,
      },
      remoteType: 'script',
      runtimePlugins: [
        require.resolve('@module-federation/modern-js-v3/shared-strategy'),
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
          runtimePkgs: ['@module-federation/modern-js-v3/runtime'],
        },
      },
    });
  });

  it('patchMFConfig: rsc remotes inject runtime bridge plugin', async () => {
    const patchedConfig = {
      name: 'rsc-host',
      remotes: {
        remote: 'http://localhost:3001/remoteEntry.js',
      },
      exposes: {
        './Widget': './src/widget.ts',
      },
      experiments: {
        rsc: true,
        asyncStartup: true,
      },
    };

    patchMFConfig(patchedConfig as any, true);

    expect(
      patchedConfig.runtimePlugins.some(runtimePlugin =>
        /rsc-bridge-runtime-plugin\.(t|j)s$/.test(
          typeof runtimePlugin === 'string' ? runtimePlugin : runtimePlugin[0],
        ),
      ),
    ).toBe(true);
    expect(patchedConfig.exposes).toBeDefined();
    const widgetExposeConfig = (patchedConfig.exposes as any)['./Widget'];
    expect(widgetExposeConfig.import).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/rsc-client-callback-bootstrap\.(mjs|js)$/),
        './src/widget.ts',
      ]),
    );
    expect((patchedConfig.exposes as any)['./Widget']).toMatchObject({
      layer: 'react-server-components',
    });
    expect(
      (patchedConfig.exposes as any)['./__rspack_rsc_bridge__'],
    ).toMatchObject({
      import: expect.stringMatching(/rsc-bridge-expose\.(t|j)s$/),
      layer: 'react-server-components',
    });
  });

  it('patchMFConfig: rsc client shared config avoids non-default client.browser providers', async () => {
    const patchedConfig = {
      name: 'rsc-host',
      remotes: {
        remote: 'http://localhost:3001/remoteEntry.js',
      },
      experiments: {
        rsc: true,
        asyncStartup: true,
      },
      shared: [
        {
          'react-server-dom-rspack/client.browser': {
            import: 'react-server-dom-rspack/client.browser',
            shareScope: 'default',
          },
        },
        {
          'react-server-dom-rspack/client.browser': {
            import: 'react-server-dom-rspack/client.browser',
            shareScope: 'ssr',
          },
        },
        {
          'react-server-dom-rspack/client.browser': {
            import: 'react-server-dom-rspack/client.browser',
            shareScope: 'rsc',
          },
        },
      ],
    };

    patchMFConfig(patchedConfig as any, false);

    const sharedScopes = patchedConfig.shared as Array<
      Record<string, { import?: unknown; shareScope?: string }>
    >;
    expect(
      sharedScopes[0]['react-server-dom-rspack/client.browser'].import,
    ).toBe('react-server-dom-rspack/client.browser');
    expect(
      sharedScopes[1]['react-server-dom-rspack/client.browser'].import,
    ).toBe(false);
    expect(
      sharedScopes[2]['react-server-dom-rspack/client.browser'].import,
    ).toBe(false);
  });

  it('patchMFConfig: rsc requires asyncStartup', async () => {
    const patchedConfig = {
      name: 'rsc-host',
      remotes: {
        remote: 'http://localhost:3001/remoteEntry.js',
      },
      experiments: {
        rsc: true,
      },
    };

    expect(() => patchMFConfig(patchedConfig as any, true)).toThrow(
      /experiments\.rsc requires experiments\.asyncStartup = true/,
    );
  });

  it('patchMFConfig: rsc exposes inject bridge expose + bootstrap without runtime bridge plugin', async () => {
    const patchedConfig = {
      name: 'rsc-remote',
      exposes: {
        './Widget': './src/widget.ts',
      },
      experiments: {
        rsc: true,
        asyncStartup: true,
      },
    };

    patchMFConfig(patchedConfig as any, true);

    expect(
      patchedConfig.runtimePlugins.some(runtimePlugin =>
        /rsc-bridge-runtime-plugin\.(t|j)s$/.test(
          typeof runtimePlugin === 'string' ? runtimePlugin : runtimePlugin[0],
        ),
      ),
    ).toBe(false);
    const widgetExposeConfig = (patchedConfig.exposes as any)['./Widget'];
    expect(widgetExposeConfig.import).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/rsc-client-callback-bootstrap\.(mjs|js)$/),
        './src/widget.ts',
      ]),
    );
    expect(
      (patchedConfig.exposes as any)['./__rspack_rsc_bridge__'],
    ).toMatchObject({
      import: expect.stringMatching(/rsc-bridge-expose\.(t|j)s$/),
      layer: 'react-server-components',
    });
  });

  it('patchMFConfig: non-rsc does not inject internal bridge expose', async () => {
    const patchedConfig = {
      name: 'host',
      remotes: {
        remote: 'http://localhost:3001/remoteEntry.js',
      },
      exposes: {
        './Widget': './src/widget.ts',
      },
      experiments: {
        asyncStartup: true,
      },
    };

    patchMFConfig(patchedConfig as any, true);

    expect((patchedConfig.exposes as any)['./Widget']).toBe('./src/widget.ts');
    expect(
      (patchedConfig.exposes as any)['./__rspack_rsc_bridge__'],
    ).toBeUndefined();
  });
});
