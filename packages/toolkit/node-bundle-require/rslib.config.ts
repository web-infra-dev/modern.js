import { defineConfig } from '@rslib/core';

export default defineConfig({
  lib: [
    {
      format: 'cjs',
      syntax: 'es2021',
      bundle: false,
      outBase: './src',
      output: {
        distPath: {
          root: './dist/cjs',
        },
        target: 'node',
      },
      dts: {
        distPath: 'dist/types',
      },
      autoExtension: true,
    },
    {
      format: 'esm',
      syntax: 'es2021',
      bundle: false,
      outBase: './src',
      autoExtension: true,
      output: {
        distPath: {
          root: './dist/esm',
        },
        target: 'node',
      },
      dts: {
        distPath: 'dist/types',
      },
    },
  ],
});
