const properties = {
  target: {
    enum: [
      'es6',
      'es5',
      'es2015',
      'es2016',
      'es2017',
      'es2018',
      'es2019',
      'es2020',
      'esnext',
    ],
  },
  format: {
    type: 'array',
    items: [{ enum: ['cjs', 'esm', 'iife'] }],
  },
  tsconfig: {
    type: 'string',
  },
  dts: {
    type: 'boolean',
  },
  bundle: {
    type: 'boolean',
  },
  bundleOption: {
    type: 'object',
    properties: {
      entry: {
        type: 'object',
      },
      splitting: {
        type: 'boolean',
      },
      external: {
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
  bundlessOption: {
    type: 'object',
    properties: {
      sourceDir: {
        type: 'string',
      },
    },
  },
  outputPath: { type: 'string' },
};

export const buildConfigSchema = [
  {
    target: 'output.buildConfig',
    schema: {
      if: {
        type: 'array',
      },
      then: { items: [{ type: 'object', properties }] },
      else: {
        oneOf: [
          { type: 'object', properties },
        ],
      },
    },
  },
];
