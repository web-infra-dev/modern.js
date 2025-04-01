import { useContext } from 'react';
import type { ImageOptions } from '../../shared/options';
import { resolveImageOptions } from '../options/image-options';
import { ImageOptionsContext } from './context';
import { applyImageLoader } from './loader';

export function useImage() {
  const resolveImage = (options: ImageOptions): string => {
    const context = useContext(ImageOptionsContext);
    const resolvedOptions = resolveImageOptions({ ...context, ...options });
    const url = applyImageLoader(resolvedOptions);
    return url;
  };
  return resolveImage;
}
