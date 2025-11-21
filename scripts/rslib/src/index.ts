import { pluginReact } from '@rsbuild/plugin-react';
import type { RslibConfig } from '@rslib/core';

export const rslibConfig: RslibConfig = {
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
      dts: {
        distPath: 'dist/types',
      },
    },
    {
      format: 'esm' as const,
      syntax: 'es2021' as const,
      bundle: false,
      outBase: './src',
      /**
       * which file (xxx.js or xxx.server.js) should be bundled should be decided by rspack.
       */
      redirect: {
        js: {
          extension: false,
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
      dts: {
        distPath: 'dist/types',
      },
    },
    {
      format: 'cjs' as const,
      syntax: 'es2021' as const,
      bundle: false,
      outBase: './src',
      output: {
        distPath: {
          root: './dist/cjs',
        },
        target: 'node' as const,
      },
    },
  ],
};
