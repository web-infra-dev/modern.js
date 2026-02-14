const CREATE_RSC_EXPOSE_DEFINITIONS_MODULE =
  '../remote/src/runtime/createRscExposeDefinitions';

const loadCreateRscExposeDefinitions = () => {
  let moduleExports: any;
  jest.isolateModules(() => {
    moduleExports = require(CREATE_RSC_EXPOSE_DEFINITIONS_MODULE);
  });
  return moduleExports as {
    createRscExposeDefinitions: (
      remoteExposeImports: Record<string, string>,
    ) => Record<string, { import: string[]; layer: string }>;
    CALLBACK_BOOTSTRAP_MODULE: string;
  };
};

describe('createRscExposeDefinitions', () => {
  it('creates callback-bootstrapped rsc expose definitions', () => {
    const { createRscExposeDefinitions, CALLBACK_BOOTSTRAP_MODULE } =
      loadCreateRscExposeDefinitions();
    const exposeDefinitions = createRscExposeDefinitions({
      './RemoteClientCounter': './src/components/RemoteClientCounter.tsx',
      './actions': './src/components/actions.ts',
    });

    expect(exposeDefinitions).toEqual({
      './RemoteClientCounter': {
        import: [
          CALLBACK_BOOTSTRAP_MODULE,
          './src/components/RemoteClientCounter.tsx',
        ],
        layer: 'react-server-components',
      },
      './actions': {
        import: [CALLBACK_BOOTSTRAP_MODULE, './src/components/actions.ts'],
        layer: 'react-server-components',
      },
    });
  });

  it('rejects expose keys that do not start with module-federation prefix', () => {
    const { createRscExposeDefinitions } = loadCreateRscExposeDefinitions();
    expect(() =>
      createRscExposeDefinitions({
        RemoteClientCounter: './src/components/RemoteClientCounter.tsx',
      }),
    ).toThrow(
      'Remote expose keys must be module-federation paths starting with "./"',
    );
  });

  it('allows expose imports outside src root when path is relative', () => {
    const { createRscExposeDefinitions, CALLBACK_BOOTSTRAP_MODULE } =
      loadCreateRscExposeDefinitions();
    expect(
      createRscExposeDefinitions({
        './RemoteClientCounter': './app/components/RemoteClientCounter.tsx',
      }),
    ).toEqual({
      './RemoteClientCounter': {
        import: [
          CALLBACK_BOOTSTRAP_MODULE,
          './app/components/RemoteClientCounter.tsx',
        ],
        layer: 'react-server-components',
      },
    });
  });

  it('rejects non-relative expose imports', () => {
    const { createRscExposeDefinitions } = loadCreateRscExposeDefinitions();
    expect(() =>
      createRscExposeDefinitions({
        './RemoteClientCounter': '/abs/components/RemoteClientCounter.tsx',
      }),
    ).toThrow('Remote exposes must point to userland relative modules (./).');
  });

  it('rejects expose imports targeting internal runtime namespace', () => {
    const { createRscExposeDefinitions } = loadCreateRscExposeDefinitions();
    expect(() =>
      createRscExposeDefinitions({
        './RemoteClientCounter': './src/runtime/helper.ts',
      }),
    ).toThrow(
      'Remote exposes must not target internal runtime namespace (./src/runtime/)',
    );
  });

  it('rejects expose imports without explicit source extension', () => {
    const { createRscExposeDefinitions } = loadCreateRscExposeDefinitions();
    expect(() =>
      createRscExposeDefinitions({
        './RemoteClientCounter': './src/components/RemoteClientCounter',
      }),
    ).toThrow(
      'Remote expose imports must use explicit source entry extensions (.js/.jsx/.ts/.tsx/.cjs/.mjs/.cts/.mts) for deterministic resolution.',
    );
  });

  it('allows cts and mts expose entry extensions', () => {
    const { createRscExposeDefinitions, CALLBACK_BOOTSTRAP_MODULE } =
      loadCreateRscExposeDefinitions();
    expect(
      createRscExposeDefinitions({
        './serverOnlyHelper': './src/lib/serverOnlyHelper.cts',
        './rscBridgeUtil': './src/lib/rscBridgeUtil.mts',
      }),
    ).toEqual({
      './serverOnlyHelper': {
        import: [CALLBACK_BOOTSTRAP_MODULE, './src/lib/serverOnlyHelper.cts'],
        layer: 'react-server-components',
      },
      './rscBridgeUtil': {
        import: [CALLBACK_BOOTSTRAP_MODULE, './src/lib/rscBridgeUtil.mts'],
        layer: 'react-server-components',
      },
    });
  });

  it('rejects expose imports with parent traversal segments', () => {
    const { createRscExposeDefinitions } = loadCreateRscExposeDefinitions();
    expect(() =>
      createRscExposeDefinitions({
        './RemoteClientCounter': './src/components/../runtime/helper.ts',
      }),
    ).toThrow(
      'Remote expose imports must not contain parent directory traversal segments.',
    );
  });

  it('rejects expose imports with windows separators', () => {
    const { createRscExposeDefinitions } = loadCreateRscExposeDefinitions();
    expect(() =>
      createRscExposeDefinitions({
        './RemoteClientCounter': './src/components\\RemoteClientCounter.tsx',
      }),
    ).toThrow(
      'Remote expose imports must use POSIX separators for deterministic module ids.',
    );
  });

  it('rejects exposing callback bootstrap module directly', () => {
    const { createRscExposeDefinitions, CALLBACK_BOOTSTRAP_MODULE } =
      loadCreateRscExposeDefinitions();
    expect(() =>
      createRscExposeDefinitions({
        './callback': CALLBACK_BOOTSTRAP_MODULE,
      }),
    ).toThrow('must remain internal-only and cannot be exposed');
  });
});
