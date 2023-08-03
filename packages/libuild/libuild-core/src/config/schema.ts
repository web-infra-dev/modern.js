const asset = {
  type: 'object',
  properties: {
    outdir: {
      typeof: 'string',
    },
    rebase: {
      typeof: 'boolean',
    },
    name: {
      typeof: ['string', 'function'],
    },
    publicPath: {
      typeof: ['string', 'function'],
    },
    limit: {
      type: 'number',
    },
  },
};
const style = {
  type: 'object',
  properties: {
    less: {
      type: 'object',
      properties: {
        additionalData: {
          typeof: ['string', 'function'],
        },
        lessOptions: {
          type: 'object',
        },
        implementation: {
          typeof: ['string', 'object'],
        },
      },
    },
    sass: {
      type: 'object',
      properties: {
        additionalData: {
          typeof: ['string', 'function'],
        },
        sassOptions: {
          type: 'object',
        },
        implementation: {
          typeof: ['string', 'object'],
        },
      },
    },
    postcss: {
      type: 'object',
      properties: {
        plugins: {
          type: 'array',
        },
        processOptions: {
          type: 'object',
        },
      },
    },
    autoModules: {
      anyOf: [
        {
          instanceof: 'RegExp',
        },
        {
          typeof: 'boolean',
        },
      ],
    },
    modules: {
      typeof: 'object',
    },
    cleanCss: {
      typeof: ['boolean', 'object'],
    },
    inject: {
      typeof: 'boolean',
    },
  },
};

const resolve = {
  type: 'object',
  properties: {
    alias: {
      type: 'object',
    },
    mainFields: {
      type: 'array',
      items: {
        type: 'string',
      },
    },
    mainFiles: {
      type: 'array',
      items: {
        type: 'string',
      },
    },
    preferRelative: {
      type: 'boolean',
    },
  },
};

const UserConfig = {
  style,
  autoExternal: {
    typeof: ['boolean', 'object'],
  },
  clean: {
    type: 'boolean',
  },
  bundle: {
    type: 'boolean',
  },
  inject: {
    type: 'array',
  },
  loader: {
    type: 'object',
  },
  input: {
    anyOf: [
      {
        type: 'array',
      },
      {
        type: 'object',
      },
    ],
  },
  sourceDir: {
    type: 'string',
  },
  outdir: {
    type: 'string',
  },
  outbase: {
    type: 'string',
  },
  entryNames: {
    type: 'string',
  },
  format: {
    if: {
      type: 'string',
    },
    then: {
      enum: ['esm', 'cjs', 'umd', 'iife'],
    },
    else: {
      instanceof: 'Function',
    },
  },
  chunkNames: {
    type: 'string',
  },
  splitting: {
    type: 'boolean',
  },
  minify: {
    anyOf: [
      {
        enum: ['esbuild', 'terser', false],
      },
      {
        type: 'object',
      },
    ],
  },
  metafile: {
    type: 'boolean',
  },
  watch: {
    type: 'boolean',
  },
  logLevel: {
    enum: ['silent', 'error', 'warning', 'info', 'debug', 'verbose'],
  },
  resolve,

  plugins: {
    type: 'array',
  },
  target: {
    type: 'string',
  },
  sourceMap: {
    enum: [true, false, 'inline', 'external'],
  },
  globals: {
    type: 'object',
  },
  external: {
    type: 'array',
    items: {
      anyOf: [
        {
          instanceof: 'RegExp',
        },
        {
          typeof: 'string',
        },
      ],
    },
  },

  define: {
    type: 'object',
  },
  platform: {
    enum: ['node', 'browser'],
  },
  asset,
  jsx: {
    enum: ['automatic', 'preserve', 'transform'],
  },
  esbuildOptions: {
    instanceof: 'Function',
  },
  sideEffects: {
    anyOf: [
      {
        type: 'array',
        items: {
          instanceof: 'RegExp',
        },
      },
      {
        type: 'boolean',
      },
      {
        instanceof: 'Function',
      },
    ],
  },
  redirect: {
    type: 'object',
    properties: {
      alias: {
        typeof: 'boolean',
      },
      style: {
        typeof: 'boolean',
      },
      asset: {
        typeof: 'boolean',
      },
    },
  },
  transformCache: {
    type: 'boolean',
  },
};

const CLIConfig = {
  root: {
    type: 'string',
  },
  configFile: {
    type: 'string',
  },
};

const BuildConfig = {
  logger: {
    type: 'object',
  },
  css_resolve: {
    instanceof: 'Function',
  },
  node_resolve: {
    instanceof: 'Function',
  },
};

const DEFAULT_SCHEMA = {
  type: 'object',
  properties: {
    ...UserConfig,
    ...CLIConfig,
    ...BuildConfig,
  },
};

export { DEFAULT_SCHEMA };
