import {
  compressJpeg,
  losslessCompressPng,
  pngQuantize,
  Transformer,
} from '@napi-rs/image';
import { Compressor, Compressors } from '../types';

export const jpegCompressor: Compressor<'jpeg'> = {
  handler(buf, options) {
    return compressJpeg(buf, options);
  },
  defaultOptions: {
    test: /\.jpeg$/,
  },
};

export const pngCompressor: Compressor<'png'> = {
  handler(buf, options) {
    return pngQuantize(buf, options);
  },
  defaultOptions: {
    test: /\.png$/,
  },
};

export const pngLosslessCompressor: Compressor<'pngLossless'> = {
  handler(buf, options) {
    return losslessCompressPng(buf, options);
  },
  defaultOptions: {
    test: /\.png$/,
  },
};

export const webpCompressor: Compressor<'webp'> = {
  handler(buf, options) {
    return new Transformer(buf).webp(options.quality);
  },
  defaultOptions: {
    test: /\.webp$/,
  },
};

export const webpLosslessCompressor: Compressor<'webpLossless'> = {
  handler(buf) {
    return new Transformer(buf).webpLossless();
  },
  defaultOptions: {
    test: /\.webp$/,
  },
};

export const avifCompressor: Compressor<'avif'> = {
  handler(buf, options) {
    return new Transformer(buf).avif(options);
  },
  defaultOptions: {
    test: /\.avif$/,
  },
};

export const icoCompressor: Compressor<'ico'> = {
  handler(buf) {
    return new Transformer(buf).ico();
  },
  defaultOptions: {
    test: /\.(ico|icon)$/,
  },
};

const compressors: Record<Compressors, Compressor<any>> = {
  jpeg: jpegCompressor,
  png: pngCompressor,
  pngLossless: pngLosslessCompressor,
  webp: webpCompressor,
  webpLossless: webpLosslessCompressor,
  avif: avifCompressor,
  ico: icoCompressor,
};

export default compressors;
