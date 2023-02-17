export const targets = [
  'es5',
  'es6',
  'es2015',
  'es2016',
  'es2017',
  'es2018',
  'es2019',
  'es2020',
  'es2021',
  'es2022',
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
  'modern-js-node',
  'modern-js-universal',
];
const buildConfigProperties = {
  alias: {
    typeof: ['object', 'function'],
  },
  asset: {
    type: 'object',
  },
  autoExternal: {
    if: {
      type: 'object',
    },
    then: {
      properties: {
        dependencies: { type: 'boolean' },
        peerDependencies: { type: 'boolean' },
      },
    },
    else: { type: 'boolean' },
  },
  buildType: {
    enum: ['bundle', 'bundleless'],
  },
  copy: {
    type: 'object',
    properties: {
      patterns: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            from: { type: 'string' },
            to: { type: 'string' },
            context: { type: 'string' },
            globOptions: { type: 'object' },
          },
        },
      },
      options: {
        type: 'object',
        properties: {
          concurrency: {
            type: 'number',
          },
        },
      },
    },
  },
  define: {
    typeof: 'object',
  },
  dts: {
    if: { type: 'object' },
    then: {
      properties: {
        distPath: { type: 'string' },
        tsconfigPath: { type: 'string' },
      },
    },
    else: { type: 'boolean' },
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
  format: {
    enum: ['cjs', 'esm', 'iife', 'umd'],
  },
  input: {
    type: ['array', 'object'],
  },
  jsx: {
    enum: ['automatic', 'transform'],
  },
  minify: {
    if: {
      type: 'object',
    },
    else: { enum: ['esbuild', 'terser', false] },
  },
  outDir: { type: 'string' },
  platform: {
    enum: ['node', 'browser'],
  },
  sourceDir: {
    typeof: 'string',
  },
  sourceMap: {
    enum: [true, false, 'inline', 'external'],
  },
  splitting: {
    type: 'boolean',
  },
  style: {
    // TODO: add properties
    type: 'object',
  },
  target: {
    enum: targets,
  },
  umdGlobals: {
    type: 'object',
  },
  umdModuleName: {
    anyOf: [
      {
        instanceof: 'Function',
      },
      {
        typeof: 'string',
      },
    ],
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
};
export const buildConfig = {
  target: 'buildConfig',
  schema: {
    if: {
      type: 'array',
    },
    then: {
      items: [
        {
          type: 'object',
          properties: buildConfigProperties,
        },
      ],
    },
    else: {
      type: 'object',
      properties: buildConfigProperties,
    },
  },
};
export const buildPreset = {
  target: 'buildPreset',
  schema: {
    if: { type: 'string' },
    then: {
      enum: presets,
    },
    else: { typeof: 'function' },
  },
};

export const legacy = {
  target: 'legacy',
  schema: {
    type: 'boolean',
  },
};

export const schema = [buildConfig, buildPreset, legacy];
export { legacySchema } from './legacy-schema';
