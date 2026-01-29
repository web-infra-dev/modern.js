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
      source: {
        define: {
          'process.env.MODERN_LIB_FORMAT': '"cjs"',
        },
      },
    },
  ],
};
