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
const INTERNAL_RSC_BRIDGE_EXPOSE_KEY = './__rspack_rsc_bridge__';
const EXPECTED_SHARED_SCOPES = ['default', 'ssr', 'rsc'];

const getExposeImports = (exposeDefinition: unknown): string[] => {
  if (typeof exposeDefinition === 'string') {
    return [exposeDefinition];
  }
  if (Array.isArray(exposeDefinition)) {
    return exposeDefinition.filter(
      (importPath): importPath is string => typeof importPath === 'string',
    );
  }
  if (
    exposeDefinition &&
    typeof exposeDefinition === 'object' &&
    'import' in exposeDefinition
  ) {
    const exposeImport = (exposeDefinition as { import?: unknown }).import;
    if (typeof exposeImport === 'string') {
      return [exposeImport];
    }
    if (Array.isArray(exposeImport)) {
      return exposeImport.filter(
        (importPath): importPath is string => typeof importPath === 'string',
      );
    }
  }
  return [];
};

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
  it('declares expected direct remote exposes and allows internal bridge expose', () => {
    const remoteConfig = loadRemoteConfig();
    const exposeEntries = Object.entries(remoteConfig.exposes || {});
    const directExposeEntries = exposeEntries.filter(
      ([exposeKey]) => exposeKey !== INTERNAL_RSC_BRIDGE_EXPOSE_KEY,
    );
    const directExposeKeys = directExposeEntries
      .map(([exposeKey]) => exposeKey)
      .sort() as string[];

    expect(directExposeKeys).toEqual(EXPECTED_REMOTE_EXPOSE_KEYS);

    for (const [exposeKey, exposeDefinition] of directExposeEntries) {
      expect(exposeKey).toMatch(/^\.\//);
      const exposeImports = getExposeImports(exposeDefinition);
      expect(exposeImports.length).toBeGreaterThan(0);
      for (const exposeImport of exposeImports) {
        expect(exposeImport).toMatch(/^\.\/src\/components\//);
        expect(exposeImport).toMatch(/\.[cm]?[jt]sx?$/i);
        expect(exposeImport).not.toContain('..');
        expect(exposeImport).not.toContain('\\');
        expect(exposeImport).not.toContain('/runtime/');
      }
    }

    const internalBridgeExposeDefinition =
      remoteConfig.exposes?.[INTERNAL_RSC_BRIDGE_EXPOSE_KEY];
    if (typeof internalBridgeExposeDefinition !== 'undefined') {
      const bridgeExposeImports = getExposeImports(
        internalBridgeExposeDefinition,
      );
      expect(bridgeExposeImports.length).toBeGreaterThan(0);
      for (const bridgeExposeImport of bridgeExposeImports) {
        expect(bridgeExposeImport).not.toContain('..');
        expect(bridgeExposeImport).not.toContain('\\');
      }
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

  it('does not define fixture-only host runtime plugins', () => {
    const productionHostConfig = loadHostConfig({
      nodeEnv: 'production',
      remotePort: '3008',
    });
    const developmentHostConfig = loadHostConfig({
      nodeEnv: 'development',
      remotePort: '3008',
    });

    expect(productionHostConfig.runtimePlugins).toBeUndefined();
    expect(developmentHostConfig.runtimePlugins).toBeUndefined();
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
