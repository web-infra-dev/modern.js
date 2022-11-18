export const source = {
  target: 'source',
  schema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      alias: { typeof: ['object', 'function'] },
      envVars: { type: 'array' },
      globalVars: { type: 'object' },
    },
  },
};

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
const commonBuildConfigProperties = {
  // entry: {
  //   type: ['string', 'array', 'object'],
  // },
  target: {
    enum: targets,
  },
  sourceMap: {
    enum: [true, false, 'inline', 'external'],
  },
  asset: {
    type: 'object',
  },
  jsx: {
    enum: ['automatic', 'transform'],
  },
  bundleOptions: {
    type: 'object',
    properties: {
      entry: {
        type: ['array', 'object'],
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
      terserOptions: {
        type: 'object',
      },
    },
  },
  bundlelessOptions: {
    type: 'object',
    properties: {
      style: {
        type: 'object',
        properties: {
          compileMode: {
            enum: ['all', 'only-compiled-code', 'only-source-code', false],
          },
          path: { type: 'string' },
        },
      },
      assets: {
        type: 'object',
        properties: {
          path: { type: 'string' },
        },
      },
    },
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

  path: { type: 'string' },

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
};

export const bundleBuildConfigProperties = {
  buildType: {
    enum: ['bundle'],
  },
  format: {
    enum: ['cjs', 'esm', 'umd', 'iife'],
  },
};
export const bundlelessBuildConfigProperties = {
  buildType: {
    enum: ['bundleless'],
  },
  format: {
    enum: ['cjs', 'esm'],
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
          if: { properties: bundleBuildConfigProperties },
          then: {
            properties: {
              ...bundleBuildConfigProperties,
              ...commonBuildConfigProperties,
            },
            additionalProperties: false,
          },
          else: {
            properties: {
              ...bundlelessBuildConfigProperties,
              ...commonBuildConfigProperties,
            },
            additionalProperties: false,
          },
        },
      ],
    },
    else: {
      type: 'object',
      if: { properties: bundleBuildConfigProperties },
      then: {
        properties: {
          ...bundleBuildConfigProperties,
          ...commonBuildConfigProperties,
        },
        additionalProperties: false,
      },
      else: {
        properties: {
          ...bundlelessBuildConfigProperties,
          ...commonBuildConfigProperties,
        },
        additionalProperties: false,
      },
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

export const schema = [source, buildConfig, buildPreset];
