import { useContext } from 'react';
import { type ImageOptions, createImageOptions } from '../../shared/options';
import type { ImageResource } from '../../types/image';
import { ImageOptionsContext } from '../image/context';
import { defaultLoader } from '../image/loader';

export function resolveImageOptions(options: ImageOptions) {
  let src: string;
  let height: number | undefined;
  let width: number | undefined;
  let thumbnail: ImageResource | undefined;
  let { unoptimized = false } = options;
  if (typeof options.src === 'string') {
    // Just use user defined width, height properties because there's no intrinsic size.
    ({ src, width, height } = options);
  } else {
    // Fill width & height by intrinsic size.
    ({ url: src, width, height, thumbnail } = options.src);
    if (options.width !== undefined && options.height !== undefined) {
      // Replacing by user defined.
      width = options.width;
      height = options.height;
    } else {
      // Calculate the missing one by the aspect ratio of intrinsic size.
      const aspectRatio = width / height;
      if (options.width !== undefined) {
        width = options.width;
        height = options.width / aspectRatio;
      } else if (options.height !== undefined) {
        width = options.height * aspectRatio;
        height = options.height;
      }
    }
  }

  if (
    typeof src !== 'string' ||
    src.startsWith('data:') ||
    src.startsWith('blob:') ||
    src.split('?', 1)[0].endsWith('.svg')
  ) {
    unoptimized = true;
  }

  const ret = {
    ...createImageOptions(),
    loader: defaultLoader,
    ...options,
    src,
    height,
    width,
    unoptimized,
    thumbnail,
  };
  return ret;
}

export interface ResolvedImageOptions
  extends ReturnType<typeof resolveImageOptions> {}

export function useResolvedImageOptions(options: ImageOptions) {
  const context = useContext(ImageOptionsContext);
  return resolveImageOptions({ ...context, ...options });
}
