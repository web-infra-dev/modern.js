import { rslibConfig } from '@modern-js/rslib';
import { define } from 'rstack';

define.lib({
  ...rslibConfig,
  lib: rslibConfig.lib.map(config => ({
    ...config,
    // The public exports point to .js files in dist/esm.
    autoExtension: config.id === 'esm-web' ? false : config.autoExtension,
  })),
  source: {
    define: {
      // Leave the application RSC manifest for the downstream Rspack build.
      RSPACK_RSC_MANIFEST: '__rspack_rsc_manifest__',
    },
  },
});
