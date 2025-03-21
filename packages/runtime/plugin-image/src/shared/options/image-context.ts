import type { ImageLoader } from '../../runtime/image/loader';

/**
 * Inheritable options for the Image component.
 *
 * Used by {@link ImageOptionsContext} to provide default values.
 * These options can be overridden by the {@link ImageProps}.
 */
export interface ImageContext {
  /**
   * Custom image loader function to handle image loading and transformation.
   * Allows integration with image CDNs and custom image processing logic.
   * @default {import('@modern-js/rsbuild-plugin-image/runtime').defaultLoader}
   */
  loader?: ImageLoader;
  /**
   * The quality of the optimized image (1-100).
   * Lower values reduce file size at the cost of visual quality.
   * Only applies when using an image optimization loader.
   * @default {75}
   */
  quality?: number;
}

export function createImageContext() {
  return {
    loader: undefined,
    quality: 75,
  } satisfies ImageContext;
}
