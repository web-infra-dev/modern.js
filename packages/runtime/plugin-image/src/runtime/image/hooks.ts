import type { ImageOptions } from '@/types/image';
import { useContext } from 'react';
import { ImageOptionsContext } from './context';
import { applyImageLoader } from './loader';
import { resolveImageOptions } from './options';

export function UNSTABLE_useImage() {
  const resolveImage = (options: ImageOptions & { width: number }): string => {
    const { width } = options;
    const context = useContext(ImageOptionsContext);
    const resolvedOptions = resolveImageOptions({ ...context, ...options });
    const url = applyImageLoader({ ...resolvedOptions, width });
    return url;
  };
  return resolveImage;
}
