import type { ImageLoader, ImageLoaderArgs } from '@/types/image';

export interface ApplyLoaderOptions extends ImageLoaderArgs {
  loader: ImageLoader;
}

export function applyImageLoader(options: ApplyLoaderOptions): string {
  const { loader, src, quality, width } = options;
  const url = loader({ src, quality, width });
  return url;
}

export const defaultImageLoader: ImageLoader = ({ src, width, quality }) =>
  `/_modern_js/image?t=${encodeURIComponent(src)}&w=${width}&q=${quality}`;
