import { defineConfig } from '@rslib/core';

export default defineConfig({
  lib: [
    {
      format: 'esm',
      source: { entry: { index: './src/index.tsx' } },
      output: { target: 'web', distPath: { root: 'dist/esm' } },
      dts: { distPath: 'dist/types' },
      autoExtension: true,
    },
    {
      format: 'esm',
      source: { entry: { server: './src/sandbox-server.ts' } },
      output: { target: 'node', distPath: { root: 'dist/esm-node' } },
      dts: { distPath: 'dist/types' },
      autoExtension: true,
    },
    {
      format: 'cjs',
      source: { entry: { server: './src/sandbox-server.ts' } },
      output: {
        target: 'node',
        distPath: { root: 'dist/cjs' },
        filename: { js: '[name].cjs' },
      },
    },
  ],
});
