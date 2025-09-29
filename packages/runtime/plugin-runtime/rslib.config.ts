import { rslibConfig } from '@modern-js/rslib';
import { defineConfig } from '@rslib/core';

export default defineConfig({
  ...rslibConfig,
  output: {
    externals: [
      {
        '@modern-js/runtime-utils/node$':
          'commonjs @modern-js/runtime-utils/node',
      },
    ],
  },
});
