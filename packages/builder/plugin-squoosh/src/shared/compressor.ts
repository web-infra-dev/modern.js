import { compressJpeg, losslessCompressPng, pngQuantize } from '@napi-rs/image';
import { Compressor, Compressors } from '../types';

export const jpegCompressor: Compressor<'jpeg'> = {
  handler(buf, options) {
    return compressJpeg(buf, options);
  },
  defaultOptions: {
    test: /\.jpeg$/,
  },
};

export const pngLossyCompressor: Compressor<'pngLossy'> = {
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

const compressors: Record<Compressors, Compressor<any>> = {
  jpeg: jpegCompressor,
  pngLossless: pngLosslessCompressor,
  pngLossy: pngLossyCompressor,
};

export default compressors;
