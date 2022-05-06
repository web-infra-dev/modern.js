import { createBabelChain } from '@modern-js/babel-chain';
import { applyOptionsChain } from '@modern-js/utils';
import { generate } from './generate';
import type { Options } from './type';

export type { Options };

const defaultOptions = {
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

/* eslint-disable  no-param-reassign */
export default function (api: any, options?: Options) {
  api.cache(true);

  options = { ...(defaultOptions as Options), ...(options ?? {}) };

  const babelChain = generate(options, options.chain || createBabelChain());

  if (options.userBabelConfig) {
    return applyOptionsChain(babelChain.toJSON(), options.userBabelConfig);
  }

  return babelChain.toJSON();
}
/* eslint-enable  no-param-reassign */
