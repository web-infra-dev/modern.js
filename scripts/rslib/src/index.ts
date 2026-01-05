import { pluginReact } from '@rsbuild/plugin-react';
import type { RslibConfig } from '@rslib/core';

export const jsRslibConfig: RslibConfig = {
  plugins: [pluginReact()],
  performance: {
    buildCache: false,
  },
  lib: [
    {
      format: 'esm' as const,
      syntax: 'es2021' as const,
      bundle: false,
      outBase: './src',
      autoExtension: true,
      output: {
        distPath: {
          root: './dist/esm-node',
        },
        target: 'node' as const,
      },
      source: {
        define: {
          'process.env.MODERN_LIB_FORMAT': '"esm"',
        },
      },
      shims: {
        esm: {
          require: true,
          __dirname: true,
          __filename: true,
        },
      },
    },
    {
      format: 'esm' as const,
      syntax: 'es2021' as const,
      bundle: false,
      outBase: './src',
      source: {
        define: {
          'process.env.MODERN_LIB_FORMAT': '"esm"',
        },
      },
      /**
       * which file (xxx.js or xxx.server.js) should be bundled should be decided by rspack.
       */
      redirect: {
        js: {
          extension: true,
          path: false,
        },
      },
      autoExtension: true,
      output: {
        distPath: {
          root: './dist/esm',
        },
        target: 'web' as const,
      },
    },
    {
      format: 'cjs' as const,
      syntax: 'es2021' as const,
      bundle: false,
      outBase: './src',
      source: {
        define: {
          'process.env.MODERN_LIB_FORMAT': '"cjs"',
        },
      },
      output: {
        distPath: {
          root: './dist/cjs',
        },
        target: 'node' as const,
      },
    },
  ],
};

export const rslibConfig: RslibConfig = {
  ...jsRslibConfig,
  lib: jsRslibConfig.lib.map(config => {
    return {
      ...config,
      dts: {
        distPath: 'dist/types',
      },
    };
  }),
};
