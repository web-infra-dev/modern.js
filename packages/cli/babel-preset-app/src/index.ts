import {
  applyUserBabelConfig,
  createBabelChain,
} from '@modern-js/babel-preset-base';
import { generate } from './generate';
import type { Options } from './type';

export type { Options };

export * from '@modern-js/babel-preset-base';

const defaultOptions: Options = {
  appDirectory: process.cwd(),
  metaName: 'modern-js',
  target: 'client',
  modules: false,
  useBuiltIns: 'entry',
  useModern: false,
  useLegacyDecorators: true,
  useTsLoader: false,
  lodash: {},
  styledComponents: {},
};

export const getBabelConfig = (options?: Options) => {
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
