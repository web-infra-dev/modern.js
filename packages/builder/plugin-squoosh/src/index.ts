import path from 'path';
import _ from '@modern-js/utils/lodash';
import { BuilderPlugin } from '@modern-js/web-builder';
import { Decoder, DecoderCollection } from './types';
import { encoders } from '../compiled/@squoosh/lib';

export interface BaseDecoderOptions<T extends Decoder> {
  use: T;
  test?: RegExp;
}

export type ComposedDecoderOptions = Decoder[] | { use: Decoder[] };

export type DecoderOptionsCollection = {
  [K in Decoder]: Partial<DecoderCollection[K]> & BaseDecoderOptions<K>;
};

export type DecoderOptions =
  | ComposedDecoderOptions
  | DecoderOptionsCollection[Decoder];

export type DecoderFinalOptionsCollection = {
  [K in Decoder]: Required<DecoderCollection[K] & BaseDecoderOptions<K>>;
};
export type DecoderFinalOptions = DecoderFinalOptionsCollection[Decoder];

export const compileExtRegExp = (ext: string) => new RegExp(`\\.${ext}$`);

export const withDefaultOptions = (
  opt: DecoderOptionsCollection[Decoder],
): DecoderFinalOptions =>
  _.merge(
    {
      test: compileExtRegExp(encoders[opt.use].extension),
    } as DecoderFinalOptions,
    encoders[opt.use].defaultEncoderOptions,
    opt,
  );

export const loaderPath = path.resolve(__dirname, 'loader.js');

export const normalizeFinalOptions = (
  options: DecoderOptions,
): DecoderFinalOptions[] => {
  if (Array.isArray(options)) {
    return options.map(use => withDefaultOptions({ use }));
  }
  if (Array.isArray(options.use)) {
    return options.use.map(use => withDefaultOptions({ use }));
  }
  if (Object.keys(encoders).includes(options.use)) {
    return [withDefaultOptions(options as DecoderFinalOptions)];
  }
  throw new Error(`Unknown encoder: ${options.use}`);
};

export const compareRegExp = (a: DecoderFinalOptions, b: DecoderFinalOptions) =>
  a.test.toString() === b.test.toString();

export const PluginSquoosh = (...options: DecoderOptions[]): BuilderPlugin => ({
  name: 'web-builder-plugin-squoosh',
  setup(api) {
    const optsWithDefault = options.length
      ? options
      : [_.keys(encoders) as Decoder[]];
    const opts = _(optsWithDefault)
      .map(normalizeFinalOptions)
      .flatten()
      .unionWith(compareRegExp)
      .value();
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
