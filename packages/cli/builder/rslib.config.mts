import { rslibConfig } from '@modern-js/rslib';
import { defineConfig } from '@rslib/core';

export default defineConfig({
  ...rslibConfig,
  lib: rslibConfig.lib?.map(config => {
    // Copy compiled directory to dist for all formats
    if (config.format === 'cjs' || config.format === 'esm') {
      return {
        ...config,
        output: {
          ...config.output,
          copy: [
            {
              from: './compiled',
              to: '../compiled',
            },
          ],
        },
      };
    }
    return config;
  }),
});
