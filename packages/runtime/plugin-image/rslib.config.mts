import { defineConfig } from '@rslib/core';

export default defineConfig({
  lib: [
    {
      format: 'esm',
      syntax: 'es2021',
      dts: true,
      source: {
        entry: { runtime: 'src/runtime.ts' },
      },
    },
    {
      format: 'cjs',
      syntax: 'es2021',
      source: {
        entry: { index: 'src/cli.ts' },
      },
    },
  ],
});
