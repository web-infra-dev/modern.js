import { defineConfig } from '@rslib/core';

export default defineConfig({
  lib: [
    {
      bundle: false,
      format: 'cjs',
      syntax: ['node 18'],
      dts: true,
    },
  ],
});
