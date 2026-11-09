import { rslibConfig } from '@modern-js/rslib';
import { define } from 'rstack';

define.lib({
  ...rslibConfig,
  source: {
    define: {
      WEBPACK_CHUNK_LOAD: '__webpack_chunk_load__',
      // The application's bundler runtime, used by the resource stage scheduler.
      // Written as defines so this package's own build leaves them alone.
      WEBPACK_SET_CHUNK_LOAD: '(fn => { __webpack_chunk_load__ = fn; })',
      WEBPACK_GET_SCRIPT_FILENAME: '__webpack_get_script_filename__',
      WEBPACK_PUBLIC_PATH: '__webpack_public_path__',
      WEBPACK_NONCE: '__webpack_nonce__',
    },
  },
  output: {
    externals: [
      {
        '@modern-js/runtime-utils/node$':
          'commonjs @modern-js/runtime-utils/node',
      },
    ],
  },
});
