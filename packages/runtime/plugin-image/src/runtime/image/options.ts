import type { ImageOptions, ImageResource } from '@/types/image';
import { defaultImageLoader } from './loader';

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

  for (const [key, value] of [
    ['width', width],
    ['height', height],
  ] as const) {
    if (value === undefined) continue;
    if (typeof value !== 'number') {
      throw new Error(
        `Image with src ${src} must have ${key} prop as a number, but got: ${value}`,
      );
    }
    if (!Number.isFinite(value)) {
      throw new Error(
        `Image with src ${src} must have ${key} prop as a number, but got: ${value}`,
      );
    }
    if (value < 0) {
      throw new Error(
        `Image with src ${src} must have ${key} prop as a positive number, but got: ${value}`,
      );
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

  const resolved = {
    densities: [1, 2],
    loader: defaultImageLoader,
    placeholder: false,
    quality: 75,
    ...options,
    src,
    height,
    width,
    unoptimized,
    thumbnail,
  } satisfies ImageOptions & Record<string, any>;
  return resolved;
}

export interface ResolvedImageOptions
  extends ReturnType<typeof resolveImageOptions> {}
