import type { Buffer } from 'buffer';
import {
  JpegCompressOptions,
  PNGLosslessOptions,
  PngQuantOptions,
} from '@napi-rs/image';

export interface WebpTransformOptions {
  quality?: number;
}

/* eslint-disable @typescript-eslint/ban-types */
export interface CodecBaseOptions {
  jpeg: JpegCompressOptions;
  png: PngQuantOptions;
  pngLossless: PNGLosslessOptions;
  ico: {};
}
/* eslint-enable */

export interface Codec<T extends Codecs> {
  handler: (buf: Buffer, options: CodecBaseOptions[T]) => Promise<Buffer>;
  defaultOptions: Omit<FinalOptionCollection[T], 'use'>;
}

export type Codecs = keyof CodecBaseOptions;

export interface BaseCompressOptions<T extends Codecs> {
  use: T;
  test: RegExp;
}

export type OptionCollection = {
  [K in Codecs]: K | FinalOptionCollection[K];
};

export type Options = OptionCollection[Codecs];

export type FinalOptionCollection = {
  [K in Codecs]: BaseCompressOptions<K> & CodecBaseOptions[K];
};

export type FinalOptions = FinalOptionCollection[Codecs];
