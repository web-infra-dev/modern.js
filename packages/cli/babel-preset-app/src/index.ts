import { createBabelChain } from '@modern-js/babel-chain';
import { generate } from './generate';
import type { Options } from './type';

export type { Options };

const defaultOptions = {
  metaName: 'modern-js',
  target: 'client',
  modules: false,
  useBuiltIns: 'entry',
  useModern: false,
  useLegacyDecorators: true,
  useTsLoader: false,
  lodash: {},
  styledCompontents: {},
};

/* eslint-disable  no-param-reassign */
export default function (api: any, options: Options) {
  api.cache(true);

  options = { ...(defaultOptions as Options), ...options };

  return generate(options, options.chain || createBabelChain()).toJSON();
}
/* eslint-enable  no-param-reassign */
