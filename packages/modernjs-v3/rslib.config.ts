import { pluginReact } from '@rsbuild/plugin-react';
import { defineConfig } from '@rslib/core';

const sharedLibOptions = {
  bundle: false,
  externalHelpers: true,
  outBase: 'src',
} as const;

export default defineConfig({
  source: {
    entry: {
      index: ['./src/**/*.{ts,tsx,js,jsx}', '!./src/**/*.spec.*'],
    },
  },
  plugins: [
    pluginReact({
      swcReactOptions: {
        runtime: 'automatic',
      },
    }),
  ],
  lib: [
    {
      ...sharedLibOptions,
      format: 'cjs',
      syntax: 'es2019',
      dts: false,
      output: {
        distPath: {
          root: './dist/cjs',
        },
      },
    },
    {
      ...sharedLibOptions,
      format: 'esm',
      syntax: 'es5',
      dts: false,
      output: {
        distPath: {
          root: './dist/esm',
        },
      },
    },
    {
      ...sharedLibOptions,
      format: 'esm',
      syntax: 'es2019',
      dts: false,
      output: {
        distPath: {
          root: './dist/esm-node',
        },
      },
    },
  ],
});
