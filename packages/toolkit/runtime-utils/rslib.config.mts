import { rslibConfig } from '@modern-js/rslib';
import { defineConfig } from '@rslib/core';

export default defineConfig({
  ...rslibConfig,
  lib: rslibConfig.lib?.map(libConfig => {
    return {
      ...libConfig,
      source: {
        // define: {
        //   REQUIRE: 'require',
        // },
      },
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
