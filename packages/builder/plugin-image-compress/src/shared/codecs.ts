import { Buffer } from 'buffer';
import {
  compressJpeg,
  losslessCompressPng,
  pngQuantize,
  Transformer,
} from '@napi-rs/image';
import svgo from 'svgo';
import { Codec, Codecs } from '../types';

export const jpegCodec: Codec<'jpeg'> = {
  handler(buf, options) {
    return compressJpeg(buf, options);
  },
  defaultOptions: {
    test: /\.(jpg|jpeg)$/,
  },
};

export const pngCodec: Codec<'png'> = {
  handler(buf, options) {
    return pngQuantize(buf, options);
  },
  defaultOptions: {
    test: /\.png$/,
  },
};

export const pngLosslessCodec: Codec<'pngLossless'> = {
  handler(buf, options) {
    return losslessCompressPng(buf, options);
  },
  defaultOptions: {
    test: /\.png$/,
  },
};

export const icoCodec: Codec<'ico'> = {
  handler(buf) {
    return new Transformer(buf).ico();
  },
  defaultOptions: {
    test: /\.(ico|icon)$/,
  },
};

export const svgCodec: Codec<'svg'> = {
  async handler(buf, options) {
    const result = svgo.optimize(buf.toString(), options);
    return Buffer.from(result.data);
  },
  defaultOptions: {
    test: /\.svg$/,
  },
};

const codecs: Record<Codecs, Codec<any>> = {
  jpeg: jpegCodec,
  png: pngCodec,
  pngLossless: pngLosslessCodec,
  ico: icoCodec,
  svg: svgCodec,
};

export default codecs;
