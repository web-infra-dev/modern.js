import { defineConfig } from '@rslib/core';

export default defineConfig({
  lib: [
    {
      format: 'esm',
      dts: {
        bundle: true,
      },
      shims: {
        esm: {
          require: true,
        },
      },
    },
  ],
});
