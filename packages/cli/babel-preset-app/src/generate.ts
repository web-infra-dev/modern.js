import type { BabelChain } from '@modern-js/babel-preset-base';
import { genCommon } from './common';
import type { Options } from './type';

export const generate = (options: Options, chain: BabelChain): BabelChain => {
  const commonChain = genCommon(options);
  return chain.merge(commonChain);
};
