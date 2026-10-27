import { defineConfig } from '@rslib/core';
export default defineConfig({
  source: {
    entry: {
      cli: './src/cli.ts',
      server: './src/server.ts',
    },
  },
  lib: [
    {
      format: 'esm',
      syntax: 'es2022',
      output: { target: 'node', distPath: { root: 'dist/esm-node' } },
      dts: { distPath: 'dist/types' },
      autoExtension: true,
    },
    {
      format: 'cjs',
      syntax: 'es2022',
      output: {
        target: 'node',
        distPath: { root: 'dist/cjs' },
        filename: { js: '[name].cjs' },
      },
    },
  ],
});
