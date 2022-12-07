import {
  BabelOptions,
  createBabelChain,
  applyUserBabelConfig,
} from '@modern-js/babel-preset-base';
import { generate } from './generate';
import type { Options } from './type';

export type { Options };

export type {
  PresetEnvOptions,
  PresetReactOptions,
  BabelConfig,
  BabelConfigUtils,
} from '@modern-js/babel-preset-base';

export * from '@modern-js/babel-preset-base';

const defaultOptions: Options = {
  appDirectory: process.cwd(),
  target: 'client',
  modules: false,
  useBuiltIns: 'entry',
  useModern: false,
  useLegacyDecorators: true,
  useTsLoader: false,
  lodash: {},
  styledComponents: {},
};

export const getBabelConfig = (options?: Options): BabelOptions => {
  const mergedOptions = { ...defaultOptions, ...options };

  const babelChain = generate(
    mergedOptions,
    mergedOptions.chain || createBabelChain(),
  );

  return applyUserBabelConfig(
    babelChain.toJSON(),
    mergedOptions.userBabelConfig,
    mergedOptions.userBabelConfigUtils,
  );
};

export default function (api: any, options?: Options) {
  api.cache(true);
  return getBabelConfig(options);
}
