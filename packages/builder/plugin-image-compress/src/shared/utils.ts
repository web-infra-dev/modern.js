import assert from 'assert';
import _ from '@modern-js/utils/lodash';
import { FinalOptions, Options } from '../types';
import codecs from './codecs';
import type { WebpackChain } from '@modern-js/utils';
import type { ModifyWebpackChainUtils } from '@modern-js/builder-webpack-provider/types';

export const withDefaultOptions = (opt: Options): FinalOptions => {
  const options = _.isString(opt) ? { use: opt } : opt;
  const { defaultOptions } = codecs[options.use];
  const ret = { ...defaultOptions, ...options };
  assert('test' in ret);
  return ret;
};

export const applyChainSVGO = async (
  chain: WebpackChain,
  options: any,
  { CHAIN_ID }: ModifyWebpackChainUtils,
): Promise<void> => {
  const rule = chain.module.rule(CHAIN_ID.RULE.SVG);
  require('@svgr/webpack').default(rule, options);
};
