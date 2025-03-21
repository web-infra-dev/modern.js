import { useContext } from 'react';
import { type ImageOptions, createImageOptions } from '../../shared/options';
import { ImageOptionsContext } from '../image/context';
import { defaultLoader } from '../image/loader';

export function resolveImageOptions(options: ImageOptions) {
  let src: string;
  let height: number | undefined;
  let width: number | undefined;
  if (typeof options.src === 'string') {
    ({ src, width, height } = options);
  } else {
    ({ url: src, width, height } = options.src);
    if (options.width !== undefined && options.height !== undefined) {
      width = options.width;
      height = options.height;
    } else {
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

  const ret = {
    ...createImageOptions(),
    loader: defaultLoader,
    ...options,
    src,
    height,
    width,
  };
  return ret;
}

export interface ResolvedImageOptions
  extends ReturnType<typeof resolveImageOptions> {}

export function useResolvedImageOptions(options: ImageOptions) {
  const context = useContext(ImageOptionsContext);
  return resolveImageOptions({ ...context, ...options });
}
