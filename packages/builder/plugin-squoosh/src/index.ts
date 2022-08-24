import path from 'path';
import _ from '@modern-js/utils/lodash';
import { BuilderPlugin } from '@modern-js/web-builder';
import { Compressors, FinalOptions, Options } from './types';
import compressors from './shared/compressor';

export const compileExtRegExp = (ext: string) => new RegExp(`\\.${ext}$`);

export const withDefaultOptions = (opt: Options): FinalOptions => {
  const options = _.isString(opt) ? { compress: opt } : opt;
  return _.defaults(options, compressors[options.compress].defaultOptions);
};

export const loaderPath = path.resolve(__dirname, 'loader.js');

export const PluginSquoosh = (...options: Options[]): BuilderPlugin => ({
  name: 'web-builder-plugin-squoosh',
  setup(api) {
    const optsWithDefault = options.length
      ? options
      : (_.keys(compressors) as Compressors[]);
    const opts = optsWithDefault.map(opt => withDefaultOptions(opt));
    api.modifyWebpackChain((chain, { CHAIN_ID }) => {
      _.each(opts, (opt, i) => {
        chain.module
          .rule(CHAIN_ID.RULE.IMAGE)
          .use(`web-builder-plugin-squoosh#${i}`)
          .loader(loaderPath)
          .options(opt);
      });
    });
  },
});
