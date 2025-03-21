import type { ImageOptions } from '../../shared/options';
import type { ResolvedImageOptions } from '../options/image-options';

export type ImageLoaderArgs = Omit<ImageOptions, 'loader'>;

export type ImageLoader = (args: ImageLoaderArgs) => string;

export const defaultLoader: ImageLoader = ({ src, width, quality }) =>
  `/_edenx/image?t=${src}&w=${width}&q=${quality}`;

export function applyImageLoader(options: ResolvedImageOptions): string {
  const { loader, src, quality, width } = options;
  const url = loader({ src, quality, width });
  return url;
}
