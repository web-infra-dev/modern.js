import _ from '@modern-js/utils/lodash';
import { BuilderPlugin } from '@modern-js/web-builder';
import { encoders, Decoder, DecoderCollection } from '@squoosh/lib';
import path from 'path';

export interface BaseDecoderOptions<T extends Decoder> {
  use: T;
  test?: RegExp;
}

export type DecoderOptionsCollection = {
  [K in Decoder]: (DecoderCollection[K] & BaseDecoderOptions<K>) | K;
};
export type DecoderOptions = DecoderOptionsCollection[Decoder];

export type DecoderFinalOptionsCollection = {
  [K in Decoder]: Required<DecoderCollection[K] & BaseDecoderOptions<K>>;
};
export type DecoderFinalOptions = DecoderFinalOptionsCollection[Decoder];

export const withDefaultOptions = <T extends Decoder>(
  opt: DecoderOptions & { use: T },
): DecoderFinalOptions =>
  _.merge({} as DecoderOptions, encoders[opt.use].defaultEncoderOptions, opt);

export const loaderPath = path.resolve(__dirname, 'loader.js');

export const SquooshPlugin = (...options: DecoderOptions[]): BuilderPlugin => ({
  name: 'web-builder-plugin-squoosh',
  setup(api) {
    const opts = _(options)
      .map(opt => (typeof opt === 'string' ? { use: opt } : opt))
      .map(opt => withDefaultOptions(opt as any))
      .value();
    api.modifyWebpackChain((chain, { CHAIN_ID }) => {
      for (const loaderOptions of opts) {
        chain.module
          .rule(CHAIN_ID.RULE.IMAGE)
          .use('web-builder-plugin-squoosh')
          .loader(loaderPath)
          .options(loaderOptions);
      }
    });
  },
});

SquooshPlugin('mozjpeg');
