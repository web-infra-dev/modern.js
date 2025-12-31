import path from 'path';
import { rslibConfig } from '@modern-js/rslib';
import { defineConfig } from '@rslib/core';

export default defineConfig({
  ...rslibConfig,
  lib: rslibConfig.lib?.map(libConfig => {
    return {
      ...libConfig,
      source: {
        entry: {
          index: [
            './src/**',
            '!src/plugins/deploy/platforms/*.mjs',
            '!src/plugins/deploy/platforms/*.cjs',
          ],
        },
      },
      output: {
        ...libConfig.output,
        copy: [
          {
            from: './src/esm',
            to: './esm',
          },
          {
            from: 'plugins/deploy/platforms/*.cjs',
            context: path.join(__dirname, 'src'),
          },
          {
            from: 'plugins/deploy/platforms/*.mjs',
            context: path.join(__dirname, 'src'),
          },
        ],
      },
    };
  }),
});
