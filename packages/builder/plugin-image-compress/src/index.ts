import _ from '@modern-js/utils/lodash';
import type { BuilderPlugin } from '@modern-js/builder-webpack-provider/types';
import path from 'path';
import { withDefaultOptions } from './shared/utils';
import { Codecs, Options } from './types';

export const loaderPath = path.resolve(__dirname, 'loader.js');
export const DEFAULT_OPTIONS: Codecs[] = ['jpeg', 'png', 'ico'];

/** Options enable by default: {@link DEFAULT_OPTIONS} */
export const PluginImageCompress = (...options: Options[]): BuilderPlugin => ({
  name: 'web-builder-plugin-image-compress',
  setup(api) {
    const optsWithDefault = options.length ? options : DEFAULT_OPTIONS;
    const opts = optsWithDefault.map(opt => withDefaultOptions(opt));
    api.modifyWebpackChain((chain, { CHAIN_ID }) => {
      _.each(opts, opt => {
        chain.module
          .rule(CHAIN_ID.RULE.IMAGE)
          .use(`web-builder-plugin-image-compress#${opt.use}`)
          .loader('@modern-js/web-builder-plugin-image-compress/loader')
          .options(opt);
      });
    });
  },
});
