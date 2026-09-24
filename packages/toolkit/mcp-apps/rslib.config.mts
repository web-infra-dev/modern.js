import { defineConfig } from '@rslib/core';

export default defineConfig({
  lib: [
    {
      id: 'esm-node',
      format: 'esm',
      syntax: 'es2022',
      source: {
        entry: {
          config: './src/config.ts',
          server: './src/server.ts',
          hono: './src/hono.ts',
          bff: './src/bff.ts',
        },
      },
      output: { target: 'node', distPath: { root: 'dist/esm-node' } },
      dts: { distPath: 'dist/types' },
      autoExtension: true,
    },
    {
      id: 'cjs-node',
      format: 'cjs',
      syntax: 'es2022',
      source: {
        entry: {
          config: './src/config.ts',
          server: './src/server.ts',
          hono: './src/hono.ts',
          bff: './src/bff.ts',
        },
      },
      output: {
        target: 'node',
        distPath: { root: 'dist/cjs' },
        filename: { js: '[name].cjs' },
      },
    },
    {
      id: 'esm-web',
      format: 'esm',
      syntax: 'es2022',
      source: { entry: { react: './src/react.ts' } },
      output: { target: 'web', distPath: { root: 'dist/esm' } },
      dts: { distPath: 'dist/types' },
      autoExtension: true,
    },
  ],
});
