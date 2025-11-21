import { rslibConfig } from '@modern-js/rslib';
import { defineConfig } from '@rslib/core';

export default defineConfig({
  ...rslibConfig,
  lib: rslibConfig.lib?.map(libConfig => {
    const isWebTarget = libConfig.output?.target === 'web';

    return {
      ...libConfig,
      ...(isWebTarget && {
        source: {
          define: {
            IS_WEB: 'true',
          },
        },
      }),
      output: {
        ...libConfig.output,
        externals: {
          async_hooks: 'async_hooks',
          './async_storage.server': './async_storage.server',
        },
      },
    };
  }),
});
