export {};

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

const expectModuleFederationPluginEnabled = (plugins: Array<any>) => {
  const hasFederationPlugin = plugins.some(plugin => {
    if (!plugin || typeof plugin !== 'object') {
      return false;
    }
    if (plugin.name === 'mf-plugin-mock') {
      return plugin.options?.ssr === true;
    }
    return plugin.name === '@modern-js/plugin-module-federation';
  });
  expect(hasFederationPlugin).toBe(true);
};

describe('rsc-mf modern config contracts', () => {
  it('keeps host modern config in baseline shape without fixture bundler hooks', () => {
    const hostConfig = loadHostConfig();

    expect(hostConfig.server).toEqual(
      expect.objectContaining({
        rsc: true,
        port: 3007,
      }),
    );
    expect(hostConfig.server).not.toHaveProperty('ssr');
    expect(hostConfig.source).toEqual(
      expect.objectContaining({
        enableAsyncEntry: false,
      }),
    );
    expect(hostConfig.source).not.toHaveProperty('preEntry');
    expect(hostConfig.tools?.bundlerChain).toBeUndefined();
    expect(hostConfig.plugins).toHaveLength(2);
    expect(hostConfig.plugins).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'app-tools-mock' }),
      ]),
    );
    expectModuleFederationPluginEnabled(hostConfig.plugins);
  });

  it('keeps remote modern config in baseline shape without fixture bundler hooks', () => {
    const remoteConfig = loadRemoteConfig({ remotePort: '3991' });

    expect(remoteConfig.server).toEqual(
      expect.objectContaining({
        rsc: true,
        ssr: true,
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
    expect(remoteConfig.source).not.toHaveProperty('preEntry');
    expect(remoteConfig.tools?.bundlerChain).toBeUndefined();
    expect(remoteConfig.plugins).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'app-tools-mock' }),
      ]),
    );
    expectModuleFederationPluginEnabled(remoteConfig.plugins);
  });

  it('keeps remote ssr mode enabled when explicit PORT is set', () => {
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
});
