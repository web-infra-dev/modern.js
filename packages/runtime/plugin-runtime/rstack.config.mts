import { rslibConfig } from '@modern-js/rslib';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { define } from 'rstack';

const cookieLicense = resolve(
  dirname(createRequire(import.meta.url).resolve('cookie')),
  '../LICENSE',
);

define.lib({
  ...rslibConfig,
  lib: rslibConfig.lib!.flatMap(config => [
    {
      ...config,
      source: {
        ...config.source,
        entry: { index: ['src/**', '!src/core/browser/cookies.ts'] },
      },
    },
    {
      ...config,
      id: `${config.id}-cookies`,
      bundle: true,
      dts: false,
      source: {
        ...config.source,
        entry: { 'core/browser/cookies': './src/core/browser/cookies.ts' },
      },
      banner: {
        js: `/*! Includes cookie@2.0.2 (MIT). See dist/licenses/cookie.txt.\n${readFileSync(cookieLicense, 'utf8').trim()}\n*/`,
      },
      output: {
        ...config.output,
        ...(config.id === 'esm-node' && {
          copy: [{ from: cookieLicense, to: '../licenses/cookie.txt' }],
        }),
      },
    },
  ]),
  source: {
    define: {
      WEBPACK_CHUNK_LOAD: '__webpack_chunk_load__',
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
