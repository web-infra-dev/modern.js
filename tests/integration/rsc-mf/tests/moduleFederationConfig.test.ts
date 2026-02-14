const HOST_MODULE_FEDERATION_CONFIG_MODULE = '../host/module-federation.config';
const REMOTE_MODULE_FEDERATION_CONFIG_MODULE =
  '../remote/module-federation.config';

const EXPECTED_REMOTE_EXPOSE_KEYS = [
  './RemoteClientCounter',
  './RemoteClientBadge',
  './RemoteServerCard',
  './RemoteServerDefault',
  './AsyncRemoteServerInfo',
  './remoteServerOnly',
  './remoteServerOnlyDefault',
  './remoteMeta',
  './actions',
  './nestedActions',
  './defaultAction',
  './actionBundle',
  './infoBundle',
].sort();

const CALLBACK_BOOTSTRAP_IMPORT = './src/runtime/initServerCallback.ts';
const EXPECTED_SHARED_SCOPES = ['default', 'ssr', 'rsc'];

const withEnv = <T>(
  env: Partial<Record<'NODE_ENV' | 'RSC_MF_REMOTE_PORT', string>>,
  run: () => T,
): T => {
  const previousNodeEnv = process.env.NODE_ENV;
  const previousRemotePort = process.env.RSC_MF_REMOTE_PORT;

  if (typeof env.NODE_ENV === 'undefined') {
    delete process.env.NODE_ENV;
  } else {
    process.env.NODE_ENV = env.NODE_ENV as NodeJS.ProcessEnv['NODE_ENV'];
  }

  if (typeof env.RSC_MF_REMOTE_PORT === 'undefined') {
    delete process.env.RSC_MF_REMOTE_PORT;
  } else {
    process.env.RSC_MF_REMOTE_PORT = env.RSC_MF_REMOTE_PORT;
  }

  try {
    return run();
  } finally {
    if (typeof previousNodeEnv === 'undefined') {
      delete process.env.NODE_ENV;
    } else {
      process.env.NODE_ENV = previousNodeEnv;
    }
    if (typeof previousRemotePort === 'undefined') {
      delete process.env.RSC_MF_REMOTE_PORT;
    } else {
      process.env.RSC_MF_REMOTE_PORT = previousRemotePort;
    }
  }
};

const loadRemoteConfig = () =>
  withEnv({}, () => {
    let config: any;
    jest.isolateModules(() => {
      config = require(REMOTE_MODULE_FEDERATION_CONFIG_MODULE).default;
    });
    return config;
  });

const loadHostConfig = ({
  nodeEnv,
  remotePort,
}: {
  nodeEnv: string;
  remotePort?: string;
}) =>
  withEnv(
    {
      NODE_ENV: nodeEnv,
      RSC_MF_REMOTE_PORT: remotePort,
    },
    () => {
      let config: any;
      jest.isolateModules(() => {
        config = require(HOST_MODULE_FEDERATION_CONFIG_MODULE).default;
      });
      return config;
    },
  );

describe('rsc-mf module federation config contracts', () => {
  it('declares expected remote exposes with callback bootstrap imports', () => {
    const remoteConfig = loadRemoteConfig();
    const exposeEntries = Object.entries(remoteConfig.exposes || {});
    const exposeKeys = exposeEntries
      .map(([exposeKey]) => exposeKey)
      .sort() as string[];
    expect(exposeKeys).toEqual(EXPECTED_REMOTE_EXPOSE_KEYS);

    for (const [exposeKey, exposeDefinition] of exposeEntries) {
      const definition = exposeDefinition as {
        import?: string[];
        layer?: string;
      };
      expect(definition.layer).toBe('react-server-components');
      expect(definition.import).toBeDefined();
      expect(Array.isArray(definition.import)).toBe(true);
      expect(definition.import).toHaveLength(2);
      expect(definition.import?.[0]).toBe(CALLBACK_BOOTSTRAP_IMPORT);
      expect(definition.import?.[1]).toMatch(/^\.\//);
      expect(definition.import?.[1]).not.toMatch(/^\.\/src\/runtime\//);
      expect(definition.import?.[1]).toMatch(/\.[tj]sx?$/);
      expect(definition.import?.[1]).not.toContain('..');
      expect(definition.import?.[1]).not.toContain('\\');
      expect(exposeKey).toMatch(/^\.\//);
    }
  });

  it('keeps remote shared scopes and experiments aligned for rsc', () => {
    const remoteConfig = loadRemoteConfig();
    const sharedScopes = remoteConfig.shared as Array<
      Record<string, { shareScope?: string }>
    >;

    expect(sharedScopes).toHaveLength(EXPECTED_SHARED_SCOPES.length);
    expect(sharedScopes.map(scope => scope.react?.shareScope)).toEqual(
      EXPECTED_SHARED_SCOPES,
    );
    expect(
      sharedScopes.map(
        scope => scope['react-server-dom-rspack/client.browser']?.shareScope,
      ),
    ).toEqual(EXPECTED_SHARED_SCOPES);
    expect(remoteConfig.experiments).toEqual(
      expect.objectContaining({
        asyncStartup: true,
        rsc: true,
      }),
    );
  });

  it('uses remote port env var in host manifest remote URL', () => {
    const hostConfig = loadHostConfig({
      nodeEnv: 'test',
      remotePort: '3999',
    });
    expect(hostConfig.remotes).toEqual(
      expect.objectContaining({
        rscRemote: 'rscRemote@http://127.0.0.1:3999/static/mf-manifest.json',
      }),
    );
  });

  it('falls back to default remote manifest port when env var is unset', () => {
    const hostConfig = loadHostConfig({
      nodeEnv: 'test',
    });
    expect(hostConfig.remotes).toEqual(
      expect.objectContaining({
        rscRemote: 'rscRemote@http://127.0.0.1:3008/static/mf-manifest.json',
      }),
    );
  });

  it('enables host runtime plugin only in production', () => {
    const productionHostConfig = loadHostConfig({
      nodeEnv: 'production',
      remotePort: '3008',
    });
    expect(productionHostConfig.runtimePlugins).toHaveLength(1);
    expect(productionHostConfig.runtimePlugins[0]).toContain(
      'runtime/forceRemotePublicPath.ts',
    );

    const developmentHostConfig = loadHostConfig({
      nodeEnv: 'development',
      remotePort: '3008',
    });
    expect(developmentHostConfig.runtimePlugins).toEqual([]);
  });

  it('keeps host experiments aligned for async startup and rsc', () => {
    const hostConfig = loadHostConfig({
      nodeEnv: 'test',
      remotePort: '3008',
    });
    expect(hostConfig.experiments).toEqual(
      expect.objectContaining({
        asyncStartup: true,
        rsc: true,
      }),
    );
  });

  it('keeps host shared scopes aligned for rsc runtime compatibility', () => {
    const hostConfig = loadHostConfig({
      nodeEnv: 'test',
      remotePort: '3008',
    });
    const sharedScopes = hostConfig.shared as Array<
      Record<string, { shareScope?: string }>
    >;

    expect(sharedScopes).toHaveLength(EXPECTED_SHARED_SCOPES.length);
    expect(sharedScopes.map(scope => scope.react?.shareScope)).toEqual(
      EXPECTED_SHARED_SCOPES,
    );
    expect(
      sharedScopes.map(
        scope => scope['react-server-dom-rspack/client.browser']?.shareScope,
      ),
    ).toEqual(EXPECTED_SHARED_SCOPES);
  });
});
