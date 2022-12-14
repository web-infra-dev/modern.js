import _ from '@modern-js/utils/lodash';
import type { BuilderPlugin } from '@modern-js/builder-webpack-provider/types';
import path from 'path';
import { withDefaultOptions } from './shared/utils';
import { Codecs, FinalOptions, Options } from './types';
import { CHAIN_ID } from '@modern-js/utils';
import ChainedConfig from '@modern-js/builder-webpack-provider/compiled/webpack-5-chain';

export const LOADER_PATH = path.resolve(__dirname, 'loader.js');
export const DEFAULT_OPTIONS: Codecs[] = ['jpeg', 'png', 'ico'];

export type PluginImageCompressOptions = Options[];

export const applyImageLoaderChain = (
  chain: ChainedConfig,
  opt: FinalOptions,
) => {
  chain.module
    .rule(CHAIN_ID.RULE.IMAGE)
    .oneOf(opt.use)
    .test(opt.test)
    .use(`${CHAIN_ID.USE.IMAGE_COMPRESS}-${opt.use}`)
    .loader(path.resolve(__dirname, './loader'))
    .options(opt);
};

export const CHAIN_ONE_OF_SVG = [
  CHAIN_ID.ONE_OF.SVG,
  CHAIN_ID.ONE_OF.SVG_ASSET,
  CHAIN_ID.ONE_OF.SVG_INLINE,
  CHAIN_ID.ONE_OF.SVG_URL,
] as const;

export const applySvgLoaderChain = (
  chain: ChainedConfig,
  opt: FinalOptions,
) => {
  const svgRule = chain.module.rule(CHAIN_ID.RULE.SVG);
  for (const ONE_OF of CHAIN_ONE_OF_SVG) {
    svgRule
      .oneOf(ONE_OF)
      .use(CHAIN_ID.USE.SVGO)
      .loader(require.resolve('svgo-loader'))
      .options(opt);
  }
};

/** Options enable by default: {@link DEFAULT_OPTIONS} */
export const PluginImageCompress = (...options: Options[]): BuilderPlugin => ({
  name: 'builder-plugin-image-compress',
  setup(api) {
    const optsWithDefault = options.length ? options : DEFAULT_OPTIONS;
    const opts = optsWithDefault.map(opt => withDefaultOptions(opt));
    api.modifyWebpackChain((chain, { env }) => {
      if (env !== 'production') {
        return;
      }
      _.each(opts, opt => {
        if (opt.use === 'svg') {
          applySvgLoaderChain(chain, opt);
        } else {
          applyImageLoaderChain(chain, opt);
        }
      });
    });
  },
});
