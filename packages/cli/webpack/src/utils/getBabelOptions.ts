import path from 'path';
import { isProd, applyOptionsChain, isUseSSRBundle } from '@modern-js/utils';
import {
  getBabelConfig,
  BabelChain,
  Options as BabelPresetAppOptions,
} from '@modern-js/babel-preset-app';
import type { NormalizedConfig, TransformOptions } from '@modern-js/core';
import { CACHE_DIRECTORY } from './constants';

export const getUseBuiltIns = (config: NormalizedConfig) => {
  const { polyfill } = config.output || {};
  if (polyfill === 'ua' || polyfill === 'off') {
    return false;
  }
  return polyfill;
};

function getCacheIdentifier(babelConfig: TransformOptions) {
  let cacheIdentifier = process.env.NODE_ENV;

  const packages = [
    {
      name: 'babel-loader',
      version: require('../../compiled/babel-loader/package.json').version,
    },
    {
      name: '@modern-js/babel-preset-app',
      version:
        require('../../package.json').dependencies[
          '@modern-js/babel-preset-app'
        ],
    },
  ];

  for (const { name, version } of packages) {
    cacheIdentifier += `:${name}@${version}`;
  }

  const pluginItems = [
    ...(babelConfig.presets || []),
    ...(babelConfig.plugins || []),
  ];
  pluginItems.forEach(pluginItem => {
    if (Array.isArray(pluginItem)) {
      cacheIdentifier += `:${pluginItem[0]}`;
    } else {
      cacheIdentifier += `:${pluginItem}`;
    }
  });

  return cacheIdentifier;
}

export const getBabelOptions = ({
  name,
  chain,
  config,
  metaName,
  appDirectory,
  babelPresetAppOptions,
}: {
  name: string;
  chain: BabelChain;
  config: NormalizedConfig;
  metaName: string;
  appDirectory: string;
  babelPresetAppOptions?: Partial<BabelPresetAppOptions>;
}) => {
  const lodashOptions = applyOptionsChain(
    { id: ['lodash', 'ramda'] },
    config.tools?.lodash as any,
  );

  const styledComponentsOptions = applyOptionsChain(
    {
      pure: true,
      displayName: true,
      ssr: isUseSSRBundle(config),
      transpileTemplateLiterals: true,
    },
    config.tools?.styledComponents,
  );

  const includes: Array<string | RegExp> = [];
  const excludes: Array<string | RegExp> = [];

  const babelUtils = {
    addIncludes(items: string | RegExp | Array<string | RegExp>) {
      if (Array.isArray(items)) {
        includes.push(...items);
      } else {
        includes.push(items);
      }
    },
    addExcludes(items: string | RegExp | Array<string | RegExp>) {
      if (Array.isArray(items)) {
        excludes.push(...items);
      } else {
        excludes.push(items);
      }
    },
  };

  const babelConfig = getBabelConfig({
    metaName,
    appDirectory,
    lodash: lodashOptions,
    useLegacyDecorators: !config.output?.enableLatestDecorators,
    useBuiltIns: getUseBuiltIns(config),
    chain,
    styledComponents: styledComponentsOptions,
    userBabelConfig: config.tools?.babel,
    userBabelConfigUtils: babelUtils,
    ...babelPresetAppOptions,
  });

  const babelLoaderOptions: TransformOptions & {
    cacheIdentifier?: string;
    cacheDirectory?: string;
    cacheCompression?: boolean;
  } = {
    babelrc: false,
    configFile: false,
    compact: isProd(),
    // enable babel loader cache because:
    // 1. babel-loader cache can speed up the rebuild time (tested on large projects).
    // 2. webpack cache get invalid in many cases, such as config changed, while babel cache is still valid.
    cacheIdentifier: getCacheIdentifier(babelConfig),
    cacheDirectory: path.resolve(
      appDirectory,
      CACHE_DIRECTORY,
      `babel/${name}`,
    ),
    cacheCompression: false,
    ...babelConfig,
  };

  return {
    options: babelLoaderOptions,
    includes,
    excludes,
  };
};
