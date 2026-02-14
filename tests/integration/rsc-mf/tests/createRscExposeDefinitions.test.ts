const CREATE_RSC_EXPOSE_DEFINITIONS_MODULE =
  '../remote/src/runtime/createRscExposeDefinitions';

const loadCreateRscExposeDefinitions = () => {
  let moduleExports: any;
  jest.isolateModules(() => {
    moduleExports = require(CREATE_RSC_EXPOSE_DEFINITIONS_MODULE);
  });
  return moduleExports as {
    createRscExposeDefinitions: (
      remoteExposeImports: Record<
        string,
        string | { import: string | string[]; [key: string]: unknown }
      >,
    ) => Record<string, { import: string[]; layer: string }>;
    CALLBACK_BOOTSTRAP_MODULE: string;
  };
};

describe('createRscExposeDefinitions', () => {
  it('creates callback-bootstrapped rsc expose definitions', () => {
    const { createRscExposeDefinitions, CALLBACK_BOOTSTRAP_MODULE } =
      loadCreateRscExposeDefinitions();
    const exposeDefinitions = createRscExposeDefinitions({
      './RemoteClientCounter': '  ./src/components/RemoteClientCounter.tsx  ',
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
    const { createRscExposeDefinitions } = loadCreateRscExposeDefinitions();
    expect(
      createRscExposeDefinitions({
        './RemoteClientCounter': './app/components/RemoteClientCounter.tsx',
      }),
    ).toEqual({
      './RemoteClientCounter': {
        import: ['./app/components/RemoteClientCounter.tsx'],
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
    const { createRscExposeDefinitions } = loadCreateRscExposeDefinitions();
    expect(
      createRscExposeDefinitions({
        './serverOnlyHelper': './src/lib/serverOnlyHelper.cts',
        './rscBridgeUtil': './src/lib/rscBridgeUtil.mts',
      }),
    ).toEqual({
      './serverOnlyHelper': {
        import: ['./src/lib/serverOnlyHelper.cts'],
        layer: 'react-server-components',
      },
      './rscBridgeUtil': {
        import: ['./src/lib/rscBridgeUtil.mts'],
        layer: 'react-server-components',
      },
    });
  });

  it('supports object expose definitions with custom fields', () => {
    const { createRscExposeDefinitions, CALLBACK_BOOTSTRAP_MODULE } =
      loadCreateRscExposeDefinitions();
    const exposeDefinitions = createRscExposeDefinitions({
      './RemoteClientCounter': {
        import: './src/components/RemoteClientCounter.tsx',
        shareScope: 'rsc',
        flag: true,
      },
    });

    expect(exposeDefinitions).toEqual({
      './RemoteClientCounter': {
        import: [
          CALLBACK_BOOTSTRAP_MODULE,
          './src/components/RemoteClientCounter.tsx',
        ],
        shareScope: 'rsc',
        flag: true,
        layer: 'react-server-components',
      },
    });
  });

  it('rejects multi-module import arrays in object expose definitions', () => {
    const { createRscExposeDefinitions } = loadCreateRscExposeDefinitions();
    expect(() =>
      createRscExposeDefinitions({
        './infoBundle': {
          import: [
            './src/components/infoBundle.ts',
            './src/components/remoteMeta.ts',
          ],
        },
      }),
    ).toThrow(
      'Remote expose import arrays must normalize to a single userland module path.',
    );
  });

  it('deduplicates repeated entries in object expose import arrays', () => {
    const { createRscExposeDefinitions } = loadCreateRscExposeDefinitions();
    const exposeDefinitions = createRscExposeDefinitions({
      './infoBundle': {
        import: [
          './src/components/infoBundle.ts',
          './src/components/infoBundle.ts',
          './src/components/infoBundle.ts',
        ],
      },
    });

    expect(exposeDefinitions).toEqual({
      './infoBundle': {
        import: ['./src/components/infoBundle.ts'],
        layer: 'react-server-components',
      },
    });
  });

  it('trims expose import path entries before deduping', () => {
    const { createRscExposeDefinitions } = loadCreateRscExposeDefinitions();
    const exposeDefinitions = createRscExposeDefinitions({
      './infoBundle': {
        import: [
          '  ./src/components/infoBundle.ts  ',
          './src/components/infoBundle.ts',
          ' ./src/components/infoBundle.ts ',
        ],
      },
    });

    expect(exposeDefinitions).toEqual({
      './infoBundle': {
        import: ['./src/components/infoBundle.ts'],
        layer: 'react-server-components',
      },
    });
  });

  it('rejects object expose definitions with invalid import payloads', () => {
    const { createRscExposeDefinitions } = loadCreateRscExposeDefinitions();
    expect(() =>
      createRscExposeDefinitions({
        './RemoteClientCounter': {
          import: [] as string[],
        },
      }),
    ).toThrow(
      'Remote expose import must be a non-empty string or string array.',
    );

    expect(() =>
      createRscExposeDefinitions({
        './RemoteClientCounter': {
          import: [42] as unknown as string[],
        },
      }),
    ).toThrow(
      'Remote expose import must be a non-empty string or string array.',
    );

    expect(() =>
      createRscExposeDefinitions({
        './RemoteClientCounter': {} as { import: string },
      }),
    ).toThrow(
      'Remote expose import must be a non-empty string or string array.',
    );

    expect(() =>
      createRscExposeDefinitions({
        './RemoteClientCounter': {
          import: '   ',
        },
      }),
    ).toThrow(
      'Remote expose import paths must be non-empty tokens after trimming.',
    );
  });

  it('rejects non-string and non-object expose definitions', () => {
    const { createRscExposeDefinitions } = loadCreateRscExposeDefinitions();
    expect(() =>
      createRscExposeDefinitions({
        './RemoteClientCounter': 7 as unknown as string,
      }),
    ).toThrow(
      'Remote expose definition must be a string path or an object with an import field.',
    );
  });

  it('forces rsc layer even if expose object provides a different layer', () => {
    const { createRscExposeDefinitions, CALLBACK_BOOTSTRAP_MODULE } =
      loadCreateRscExposeDefinitions();
    expect(
      createRscExposeDefinitions({
        './RemoteClientCounter': {
          import: './src/components/RemoteClientCounter.tsx',
          layer: 'server-side-rendering',
        },
      }),
    ).toEqual({
      './RemoteClientCounter': {
        import: [
          CALLBACK_BOOTSTRAP_MODULE,
          './src/components/RemoteClientCounter.tsx',
        ],
        layer: 'react-server-components',
      },
    });
  });

  it('rejects import arrays that include callback bootstrap module', () => {
    const { createRscExposeDefinitions, CALLBACK_BOOTSTRAP_MODULE } =
      loadCreateRscExposeDefinitions();
    expect(() =>
      createRscExposeDefinitions({
        './RemoteClientCounter': {
          import: [
            './src/components/RemoteClientCounter.tsx',
            CALLBACK_BOOTSTRAP_MODULE,
          ],
        },
      }),
    ).toThrow('must remain internal-only and cannot be exposed');
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

  it('injects callback bootstrap only for callback-capable expose keys', () => {
    const { createRscExposeDefinitions, CALLBACK_BOOTSTRAP_MODULE } =
      loadCreateRscExposeDefinitions();
    expect(
      createRscExposeDefinitions({
        './RemoteClientCounter': './src/components/RemoteClientCounter.tsx',
        './actions': './src/components/actions.ts',
        './RemoteServerDefault': './src/components/RemoteServerDefault.tsx',
      }),
    ).toEqual({
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
      './RemoteServerDefault': {
        import: ['./src/components/RemoteServerDefault.tsx'],
        layer: 'react-server-components',
      },
    });
  });

  it('infers callback bootstrap from re-exported use server modules', () => {
    const { createRscExposeDefinitions, CALLBACK_BOOTSTRAP_MODULE } =
      loadCreateRscExposeDefinitions();
    expect(
      createRscExposeDefinitions({
        './customBundledActions': './src/components/actionBundle.ts',
      }),
    ).toEqual({
      './customBundledActions': {
        import: [CALLBACK_BOOTSTRAP_MODULE, './src/components/actionBundle.ts'],
        layer: 'react-server-components',
      },
    });
  });

  it('infers callback bootstrap from local import graph use client directives', () => {
    const { createRscExposeDefinitions, CALLBACK_BOOTSTRAP_MODULE } =
      loadCreateRscExposeDefinitions();
    expect(
      createRscExposeDefinitions({
        './customRemoteServerCard': './src/components/RemoteServerCard.tsx',
      }),
    ).toEqual({
      './customRemoteServerCard': {
        import: [
          CALLBACK_BOOTSTRAP_MODULE,
          './src/components/RemoteServerCard.tsx',
        ],
        layer: 'react-server-components',
      },
    });
  });

  it('infers callback bootstrap from local dynamic import graph', () => {
    const { createRscExposeDefinitions, CALLBACK_BOOTSTRAP_MODULE } =
      loadCreateRscExposeDefinitions();
    expect(
      createRscExposeDefinitions({
        './customDynamicActionLoader':
          './src/components/dynamicActionLoader.ts',
      }),
    ).toEqual({
      './customDynamicActionLoader': {
        import: [
          CALLBACK_BOOTSTRAP_MODULE,
          './src/components/dynamicActionLoader.ts',
        ],
        layer: 'react-server-components',
      },
    });
  });

  it('does not infer callback bootstrap from type-only local imports', () => {
    const { createRscExposeDefinitions } = loadCreateRscExposeDefinitions();
    expect(
      createRscExposeDefinitions({
        './customTypeOnlyActionImport':
          './src/components/typeOnlyActionImport.ts',
      }),
    ).toEqual({
      './customTypeOnlyActionImport': {
        import: ['./src/components/typeOnlyActionImport.ts'],
        layer: 'react-server-components',
      },
    });
  });

  it('does not infer callback bootstrap from named type-only imports', () => {
    const { createRscExposeDefinitions } = loadCreateRscExposeDefinitions();
    expect(
      createRscExposeDefinitions({
        './customNamedTypeOnlyActionImport':
          './src/components/namedTypeOnlyActionImport.ts',
      }),
    ).toEqual({
      './customNamedTypeOnlyActionImport': {
        import: ['./src/components/namedTypeOnlyActionImport.ts'],
        layer: 'react-server-components',
      },
    });
  });

  it('does not infer callback bootstrap from type-only re-export clauses', () => {
    const { createRscExposeDefinitions } = loadCreateRscExposeDefinitions();
    expect(
      createRscExposeDefinitions({
        './customExportTypeOnlyActionBridge':
          './src/components/exportTypeOnlyActionBridge.ts',
      }),
    ).toEqual({
      './customExportTypeOnlyActionBridge': {
        import: ['./src/components/exportTypeOnlyActionBridge.ts'],
        layer: 'react-server-components',
      },
    });
  });

  it('infers callback bootstrap when import clause includes runtime bindings', () => {
    const { createRscExposeDefinitions, CALLBACK_BOOTSTRAP_MODULE } =
      loadCreateRscExposeDefinitions();
    expect(
      createRscExposeDefinitions({
        './customMixedTypeValueActionImport':
          './src/components/mixedTypeValueActionImport.ts',
      }),
    ).toEqual({
      './customMixedTypeValueActionImport': {
        import: [
          CALLBACK_BOOTSTRAP_MODULE,
          './src/components/mixedTypeValueActionImport.ts',
        ],
        layer: 'react-server-components',
      },
    });
  });

  it('keeps non-callback source modules free of callback bootstrap import', () => {
    const { createRscExposeDefinitions } = loadCreateRscExposeDefinitions();
    expect(
      createRscExposeDefinitions({
        './customInfoBundle': './src/components/infoBundle.ts',
      }),
    ).toEqual({
      './customInfoBundle': {
        import: ['./src/components/infoBundle.ts'],
        layer: 'react-server-components',
      },
    });
  });
});
