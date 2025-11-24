import { rslibConfig } from '@modern-js/rslib';
import { defineConfig } from '@rslib/core';

export default defineConfig({
  ...rslibConfig,
  lib: rslibConfig.lib?.map(libConfig => {
    return {
      ...libConfig,
      output: {
        ...libConfig.output,
        copy: [
          {
            from: './src/esm',
            to: './esm',
          },
        ],
      },
    };
  }),
});
