import { type ImageContext, createImageContext } from './image-context';

export interface ImageComponentContext extends ImageContext {
  /**
   * Whether the image should fill its parent container.
   * When true, the image will stretch to fill its parent container's dimensions.
   * Parent must have 'position: relative' and dimensions set.
   * @example fill={true}
   */
  fill?: boolean;
  /**
   * Loading behavior for the image.
   * 'lazy' enables lazy loading, 'eager' loads immediately.
   * @default {lazy}
   */
  loading?: 'lazy' | 'eager';
  /**
   * Array of pixel density values for responsive images.
   * Used to generate srcset for different device pixel ratios.
   *
   * It's recommended to use **UP TO 2x DENSITY**.
   * Since 3x resolution OLED screens actually only have 1.5x resolution in red and blue channels.
   * Therefore, limiting images to 2x resolution on ultra-high resolution devices
   * can speed up loading and reduce data consumption significantly without any appreciable quality loss.
   * @default {[1,2]}
   */
  densities?: number[];
  /**
   * Placeholder to show while the image is loading.
   * Can be set to 'blur' for a blurred version of the image,
   * or a custom base64 encoded image data.
   * Set to false to disable placeholder.
   * @default {false}
   */
  placeholder?: 'blur' | (string & {}) | false;
}

export function createImageComponentContext() {
  return {
    ...createImageContext(),
    densities: [1, 2],
    fill: false,
    loading: 'lazy',
    placeholder: false,
  } satisfies ImageComponentContext;
}
