import { isProd, applyOptionsChain, isUseSSRBundle } from '@modern-js/utils';
import {
  getBabelConfig,
  BabelChain,
  Options as BabelPresetAppOptions,
} from '@modern-js/babel-preset-app';
import { BabelTransformOptions as TransformOptions } from '@modern-js/types';
import type { AppLegacyNormalizedConfig } from '@modern-js/app-tools';

export const getUseBuiltIns = (config: AppLegacyNormalizedConfig) => {
  const { polyfill } = config.output || {};
  if (polyfill === 'ua' || polyfill === 'off') {
    return false;
  }
  return polyfill;
};

export const getBabelOptions = (
  appDirectory: string,
  config: AppLegacyNormalizedConfig,
  chain: BabelChain,
  babelPresetAppOptions?: Partial<BabelPresetAppOptions>,
) => {
  // remove the lodash Options, modernjs not support tools.lodash
  // const lodashOptions = applyOptionsChain(
  //   { id: ['lodash', 'ramda'] },
  //   config.tools?.lodash,
  // );

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

  const babelOptions: TransformOptions = {
    babelrc: false,
    configFile: false,
    compact: isProd(),
    ...getBabelConfig({
      appDirectory,
      lodash: {},
      useLegacyDecorators: !config.output?.enableLatestDecorators,
      useBuiltIns: getUseBuiltIns(config),
      chain,
      styledComponents: styledComponentsOptions,
      userBabelConfig: config.tools?.babel,
      userBabelConfigUtils: babelUtils,
      ...babelPresetAppOptions,
    }),
  };

  return {
    options: babelOptions,
    includes,
    excludes,
  };
};
