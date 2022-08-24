import path from 'path';
import _ from '@modern-js/utils/lodash';
import { BuilderPlugin } from '@modern-js/web-builder';
import { Codecs, FinalOptions, Options } from './types';
import codecs from './shared/codecs';

export const withDefaultOptions = (opt: Options): FinalOptions => {
  const options = _.isString(opt) ? { compress: opt } : opt;
  return _.defaults(options, codecs[options.compress].defaultOptions);
};

export const loaderPath = path.resolve(__dirname, 'loader.js');

export const PluginSquoosh = (...options: Options[]): BuilderPlugin => ({
  name: 'web-builder-plugin-image-compress',
  setup(api) {
    const optsWithDefault = options.length
      ? options
      : (_.keys(codecs) as Codecs[]);
    const opts = optsWithDefault.map(opt => withDefaultOptions(opt));
    api.modifyWebpackChain((chain, { CHAIN_ID }) => {
      _.each(opts, opt => {
        chain.module
          .rule(CHAIN_ID.RULE.IMAGE)
          .use(`web-builder-plugin-image-compress#${opt.compress}`)
          .loader(loaderPath)
          .options(opt);
      });
    });
  },
});
