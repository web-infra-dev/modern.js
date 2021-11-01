import path from 'path';
import {
  isProd,
  getCacheIdentifier,
  applyOptionsChain,
  isUseSSRBundle,
} from '@modern-js/utils';
import { NormalizedConfig } from '@modern-js/core';
import { Options as BabelPresetAppOptions } from '@modern-js/babel-preset-app';
import type { BabelChain } from '@modern-js/babel-chain';
import { readPackageJson } from './readPackageJson';
import { CACHE_DIRECTORY } from './constants';

export const getBabelOptions = (
  appDirectory: string,
  config: NormalizedConfig,
  name: string,
  chain: BabelChain,
) => ({
  babelrc: false,
  configFile: false,
  cacheIdentifier: getCacheIdentifier([
    {
      name: 'babel-loader',
      version: readPackageJson(require.resolve('babel-loader')).version,
    },
    {
      name: '@modern-js/babel-preset-app',
      version: readPackageJson(require.resolve('@modern-js/babel-preset-app'))
        .version,
    },
  ]),
  cacheDirectory: path.resolve(appDirectory, CACHE_DIRECTORY, `babel/${name}`),
  cacheCompression: false,
  compact: isProd(),
  presets: [
    [
      require.resolve('@modern-js/babel-preset-app'),
      {
        appDirectory,
        target: 'client',
        lodash: applyOptionsChain(
          { id: ['lodash', 'ramda'] },
          config.tools?.lodash as any,
        ),
        useLegacyDecorators: !config.output?.enableLatestDecorators,
        useBuiltIns:
          config.output?.polyfill === 'ua' || config.output?.polyfill === 'off'
            ? false
            : config.output?.polyfill,
        chain,
        styledCompontents: applyOptionsChain(
          {
            pure: true,
            displayName: true,
            ssr: isUseSSRBundle(config),
            transpileTemplateLiterals: true,
          },
          (config.tools as any)?.styledComponents,
        ),
      } as BabelPresetAppOptions,
    ],
  ],
});
