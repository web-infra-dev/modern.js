import {
  compressJpeg,
  losslessCompressPng,
  pngQuantize,
  Transformer,
} from '@napi-rs/image';
import { Codec, Codecs } from '../types';

export const jpegCodec: Codec<'jpeg'> = {
  handler(buf, options) {
    return compressJpeg(buf, options);
  },
  defaultOptions: {
    test: /\.jpeg$/,
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

export const webpCodec: Codec<'webp'> = {
  handler(buf, options) {
    return new Transformer(buf).webp(options.quality);
  },
  defaultOptions: {
    test: /\.webp$/,
  },
};

export const webpLosslessCodec: Codec<'webpLossless'> = {
  handler(buf) {
    return new Transformer(buf).webpLossless();
  },
  defaultOptions: {
    test: /\.webp$/,
  },
};

export const avifCodec: Codec<'avif'> = {
  handler(buf, options) {
    return new Transformer(buf).avif(options);
  },
  defaultOptions: {
    test: /\.avif$/,
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

const codecs: Record<Codecs, Codec<any>> = {
  jpeg: jpegCodec,
  png: pngCodec,
  pngLossless: pngLosslessCodec,
  webp: webpCodec,
  webpLossless: webpLosslessCodec,
  avif: avifCodec,
  ico: icoCodec,
};

export default codecs;
