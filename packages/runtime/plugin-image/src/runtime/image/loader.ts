import type { ImageOptions } from '../../shared/options';
import type { ResolvedImageOptions } from '../options/image-options';

export interface ImageLoaderArgs {
  src: string;
  quality: number;
  width: number;
}

export type ImageLoader = (args: ImageLoaderArgs) => string;

export interface ApplyLoaderOptions extends ImageLoaderArgs {
  loader: ImageLoader;
}

export function applyImageLoader(options: ApplyLoaderOptions): string {
  const { loader, src, quality, width } = options;
  const url = loader({ src, quality, width });
  return url;
}

export const defaultLoader: ImageLoader = ({ src, width, quality }) =>
  `/_edenx/image?t=${encodeURIComponent(src)}&w=${width}&q=${quality}`;
