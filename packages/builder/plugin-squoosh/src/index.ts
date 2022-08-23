import path from 'path';
import _ from '@modern-js/utils/lodash';
import { BuilderPlugin } from '@modern-js/web-builder';
import { Decoder, DecoderCollection, encoders } from '@squoosh/lib';

export interface BaseDecoderOptions<T extends Decoder> {
  use: T;
  test?: RegExp;
}

export type DecoderOptionsCollection = {
  [K in Decoder]: K | (Partial<DecoderCollection[K]> & BaseDecoderOptions<K>);
};

export type DecoderOptions = DecoderOptionsCollection[Decoder];

export type DecoderFinalOptionsCollection = {
  [K in Decoder]: Required<DecoderCollection[K] & BaseDecoderOptions<K>>;
};
export type DecoderFinalOptions = DecoderFinalOptionsCollection[Decoder];

export const compileExtRegExp = (ext: string) => new RegExp(`\\.${ext}$`);

export const withDefaultOptions = (
  opt: DecoderOptions,
): DecoderFinalOptions => {
  const options = _.isString(opt) ? { use: opt } : opt;
  return _.merge(
    {
      test: compileExtRegExp(encoders[options.use].extension),
    } as DecoderFinalOptions,
    encoders[options.use].defaultEncoderOptions,
    opt,
  );
};

export const loaderPath = path.resolve(__dirname, 'loader.js');

export const PluginSquoosh = (...options: DecoderOptions[]): BuilderPlugin => ({
  name: 'web-builder-plugin-squoosh',
  setup(api) {
    const optsWithDefault = options.length
      ? options
      : (_.keys(encoders) as Decoder[]);
    const opts = optsWithDefault.map(withDefaultOptions);
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
