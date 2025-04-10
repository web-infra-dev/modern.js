import { DEFAULT_IPX_BASENAME } from '@/shared/constants';
import type { ImageLoader, ImageLoaderArgs } from '@/types/image';
import { joinURL } from 'ufo';

export interface ApplyLoaderOptions extends ImageLoaderArgs {
  loader: ImageLoader;
}

export function applyImageLoader(options: ApplyLoaderOptions): string {
  const { loader, src, quality, width } = options;
  const url = loader({ src, quality, width });
  return url;
}

let ipxImageLoaderBasename = DEFAULT_IPX_BASENAME;
if (typeof __INTERNAL_MODERNJS_IMAGE_BASENAME__ === 'string') {
  ipxImageLoaderBasename = __INTERNAL_MODERNJS_IMAGE_BASENAME__;
}

export const ipxImageLoader: ImageLoader = ({ src, width, quality }) => {
  const params: Record<string, string> = {
    f: 'auto',
    w: width.toString(),
    q: quality.toString(),
  };
  const paramsStr = Object.entries(params)
    .map(([k, v]) => `${k}_${v}`)
    .join(',');
  return joinURL(ipxImageLoaderBasename, paramsStr, src);
};

export default ipxImageLoader;
