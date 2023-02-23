export const targets = [
  'es5',
  'es6',
  'es2015',
  'es2016',
  'es2017',
  'es2018',
  'es2019',
  'es2020',
  // The default target is esnext which means that by default, assume all of the latest JavaScript and CSS features are supported.
  'esnext',
];

export const presets = [
  'npm-library',
  'npm-library-with-umd',
  'npm-component',
  'npm-component-with-umd',
  ...[
    'npm-library',
    'npm-library-with-umd',
    'npm-component',
    'npm-component-with-umd',
  ].reduce<string[]>((ret, crt) => {
    return [...ret, ...targets.map(t => `${crt}-${t}`)];
  }, []),
];

const properties = {
  target: {
    enum: targets,
  },
  format: {
    enum: ['cjs', 'esm', 'umd'],
  },
  sourceMap: {
    enum: [true, false, 'inline', 'external'],
  },
  buildType: {
    enum: ['bundle', 'bundleless'],
  },
  bundleOptions: {
    type: 'object',
    properties: {
      getModuleId: {
        instanceof: 'Function',
      },
      entry: {
        type: 'object',
      },
      splitting: {
        type: 'boolean',
      },
      externals: {
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
      platform: {
        enum: ['node', 'browser'],
      },
      minify: {
        enum: ['esbuild', 'terser', false],
      },
      skipDeps: {
        type: 'boolean',
      },
    },
  },
  bundlelessOptions: {
    type: 'object',
    properties: {
      sourceDir: {
        type: 'string',
      },
      style: {
        type: 'object',
        properties: {
          compileMode: {
            enum: ['all', 'only-compiled-code', 'only-source-code', false],
          },
          path: { type: 'string' },
        },
      },
      static: {
        type: 'object',
        properties: {
          path: { type: 'string' },
        },
      },
    },
  },

  tsconfig: {
    type: 'string',
  },
  enableDts: {
    type: 'boolean',
  },
  dtsOnly: {
    type: 'boolean',
  },

  outputPath: { type: 'string' },
};

export const buildSchema = [
  {
    target: 'output.buildConfig',
    schema: {
      if: {
        type: 'array',
      },
      then: {
        items: [{ type: 'object', properties, additionalProperties: false }],
      },
      else: { type: 'object', properties, additionalProperties: false },
    },
  },
  {
    target: 'output.buildPreset',
    schema: {
      enum: presets,
    },
  },
];

const PACKAGE_MODE_LIST = [
  'universal-js',
  'universal-js-lite',
  'browser-js',
  'browser-js-lite',
  'node-js',
];

export const outputSchema = [
  /** packageMode will deprecated */
  {
    target: 'output.packageMode',
    schema: { enum: PACKAGE_MODE_LIST },
  },
  /** packageFields will deprecated */
  {
    target: 'output.packageFields',
    schema: { typeof: 'object' },
  },
  /** enableSourceMap will deprecated */
  {
    target: 'output.enableSourceMap',
    schema: { typeof: 'boolean' },
  },
  /** importStyle will deprecated */
  {
    target: 'output.importStyle',
    schema: {
      enum: ['compiled-code', 'source-code'],
    },
  },
  /** assetsPath will deprecated */
  {
    target: 'output.assetsPath',
    schema: {
      typeof: 'string',
      default: 'styles',
    },
  },
  ...buildSchema,
];

export const sourceSchema = [
  {
    target: 'source.jsxTransformRuntime',
    schema: {
      // https://babeljs.io/docs/en/babel-preset-react#runtime
      enum: ['classic', 'automatic'],
    },
  },
];

export const toolsSchema = [
  {
    target: 'tools.speedy',
    schema: {
      typeof: ['object', 'function'],
    },
  },
];

export const legacySchema = [...sourceSchema, ...outputSchema, ...toolsSchema];
