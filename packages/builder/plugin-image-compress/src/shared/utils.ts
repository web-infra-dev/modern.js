import assert from 'assert';
import _ from '@modern-js/utils/lodash';
import { FinalOptions, Options } from '../types';
import codecs from './codecs';

export const withDefaultOptions = (opt: Options): FinalOptions => {
  const options = _.isString(opt) ? { use: opt } : opt;
  const { defaultOptions } = codecs[options.use];
  const ret = { ...defaultOptions, ...options };
  assert('test' in ret);
  return ret;
};
