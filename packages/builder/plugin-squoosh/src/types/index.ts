import { encoders } from '../../compiled/@squoosh/lib';
import {
  AvifEncodeOptions,
  JxlEncodeOptions,
  MozJPEGEncodeOptions,
  OxiPngEncodeOptions,
  WebPEncodeOptions,
  WP2EncodeOptions,
} from '../../compiled/@squoosh/lib/codecs';

export interface DecoderCollection {
  mozjpeg: MozJPEGEncodeOptions;
  webp: WebPEncodeOptions;
  avif: AvifEncodeOptions;
  jxl: JxlEncodeOptions;
  wp2: WP2EncodeOptions;
  oxipng: OxiPngEncodeOptions;
}

export type Decoder = keyof DecoderCollection;

export type Codec = typeof encoders[keyof typeof encoders];
