import type { Buffer } from 'buffer';
import {
  JpegCompressOptions,
  PNGLosslessOptions,
  PngQuantOptions,
} from '@napi-rs/image';
import type { Config as SvgoConfig } from 'svgo';

export type ArrayOrNot<T> = T | T[];

export interface WebpTransformOptions {
  quality?: number;
}

export interface CodecBaseOptions {
  jpeg: JpegCompressOptions;
  png: PngQuantOptions;
  pngLossless: PNGLosslessOptions;
  ico: {
    /* empty */
  };
  svg: SvgoConfig;
}

export interface BaseCompressOptions<T extends Codecs> {
  use: T;
  test?: ArrayOrNot<RegExp>;
  include?: ArrayOrNot<RegExp>;
  exclude?: ArrayOrNot<RegExp>;
}

export type FinalOptionCollection = {
  [K in Codecs]: BaseCompressOptions<K> & CodecBaseOptions[K];
};

export type FinalOptions = FinalOptionCollection[Codecs];

export interface Codec<T extends Codecs> {
  handler: (buf: Buffer, options: CodecBaseOptions[T]) => Promise<Buffer>;
  defaultOptions: Omit<FinalOptionCollection[T], 'use'>;
}

export type Codecs = keyof CodecBaseOptions;

export type OptionCollection = {
  [K in Codecs]: K | FinalOptionCollection[K];
};

export type Options = OptionCollection[Codecs];
