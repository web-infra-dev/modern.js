import type { ImageModule } from '../../types/image';
import { type ImageContext, createImageContext } from './image-context';

export interface ImageOptions extends ImageContext {
  /**
   * The source URL or imported image module for the image.
   * Can be an absolute URL ('/profile.png') or an imported image module.
   * @example src="/profile.png"
   */
  src: string | ImageModule;
  /**
   * The width of the image in pixels.
   * Required unless using 'fill' mode.
   * Should be used along with 'height' to prevent layout shifts.
   * @example width={500}
   */
  width?: number;
  /**
   * The height of the image in pixels.
   * Required unless using 'fill' mode.
   * Should be used along with 'width' to prevent layout shifts.
   * @example height={500}
   */
  height?: number;
  /**
   * Whether to disable image optimization.
   *
   * But it will enforced to be `true` while some cases:
   * - `src` is an invalid URL.
   * - `src` is a data URL / blob URL.
   * - Using a SVG image.
   * @default false
   */
  unoptimized?: boolean;
}

export function createImageOptions() {
  return {
    ...createImageContext(),
    src: '',
    width: undefined,
    height: undefined,
    unoptimized: false,
  } satisfies ImageOptions;
}
