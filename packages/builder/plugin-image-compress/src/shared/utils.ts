import _ from '@modern-js/utils/lodash';
import { FinalOptions, Options } from '../types';
import codecs from './codecs';

export const withDefaultOptions = (opt: Options): FinalOptions => {
  const options = _.isString(opt) ? { use: opt } : opt;
  return _.defaults(options, codecs[options.use].defaultOptions);
};
