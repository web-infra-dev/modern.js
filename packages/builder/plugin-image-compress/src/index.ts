import _ from '@modern-js/utils/lodash';
import type { BuilderPlugin } from '@modern-js/builder-webpack-provider/types';
import path from 'path';
import { withDefaultOptions } from './shared/utils';
import { Codecs, Options } from './types';

export const loaderPath = path.resolve(__dirname, 'loader.js');
export const DEFAULT_OPTIONS: Codecs[] = ['jpeg', 'png', 'ico'];

export type PluginImageCompressOptions = Options[];

/** Options enable by default: {@link DEFAULT_OPTIONS} */
export const PluginImageCompress = (...options: Options[]): BuilderPlugin => ({
  name: 'builder-plugin-image-compress',
  setup(api) {
    const optsWithDefault = options.length ? options : DEFAULT_OPTIONS;
    const opts = optsWithDefault.map(opt => withDefaultOptions(opt));
    api.modifyWebpackChain((chain, { CHAIN_ID, env }) => {
      if (env !== 'production') {
        return;
      }
      const rule = chain.module.rule(CHAIN_ID.RULE.IMAGE);
      _.each(opts, opt => {
        rule
          .oneOf(opt.use)
          .test(opt.test)
          .use(`${CHAIN_ID.USE.IMAGE_COMPRESS}-${opt.use}`)
          .loader(path.resolve(__dirname, './loader'))
          .options(opt);
      });
    });
  },
});
