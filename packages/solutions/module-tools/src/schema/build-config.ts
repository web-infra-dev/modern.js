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
      entry: {
        type: 'object',
      },
      splitting: {
        type: 'boolean',
      },
      externals: {
        type: 'array',
        items: [{ type: 'string' }],
      },
      platform: {
        enum: ['node', 'browser'],
      },
      minify: {
        enum: ['esbuild', 'terser', false],
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
      then: { items: [{ type: 'object', properties }] },
      else: { type: 'object', properties },
    },
  },
  {
    target: 'output.buildPreset',
    schema: {
      enum: presets,
    },
  },
];
