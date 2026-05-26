import { defineConfig } from '@rslib/core';

export default defineConfig({
  lib: [
    {
      format: 'esm',
      bundle: true,
      autoExternal: false,
      syntax: 'es2021',
    },
  ],
  output: {
    target: 'web',
  },
});
