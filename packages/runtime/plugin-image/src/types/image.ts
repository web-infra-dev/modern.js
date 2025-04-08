import type { CSSProperties } from 'react';

export interface ImageSize {
  width: number;
  height: number;
}

export interface ImageResource extends ImageSize {
  url: string;
}

export interface ImageModule extends ImageResource {
  thumbnail?: ImageResource;
}

export interface ImageLoaderArgs
  extends Pick<ImageProps, 'src' | 'quality' | 'width'> {
  src: string;
  quality: number;
  width: number;
}

export type ImageLoader = (args: ImageLoaderArgs) => string;

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
  /**
   * Loading behavior for the image.
   * 'lazy' enables lazy loading, 'eager' loads immediately.
   *
   * Avoid using `priority={true}` together with `loading="lazy"`
   * as these attributes have contradictory purposes.
   *
   * Will be default to `'lazy'` while the {@link ImageProps.priority} is not `true`.
   * @default {'lazy'}
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

/**
 * Serializable options for the Image component.
 * These options can be configured in the compile-time.
 * And will been serialized and passed to runtime.
 *
 * Used by {@link ImageOptionsContext} to provide default values.
 * These options can be overridden by the {@link ImageContext} and {@link ImageProps}.
 */
export interface ImageSerializableContext extends Omit<ImageContext, 'loader'> {
  loader?: string;
}

export interface ImageOptions extends Omit<ImageContext, 'loading'> {
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

export interface ImageProps extends ImageOptions, ImageContext {
  /**
   * Whether the image should fill its parent container.
   * When true, the image will stretch to fill its parent container's dimensions.
   * Parent must have 'position: relative' and dimensions set.
   * @example fill={true}
   */
  fill?: boolean;
  /**
   * Whether the image should be prioritized for loading.
   * When true, the image will be preloaded and given loading priority.
   * Use for images that are above the fold or critical to user experience.
   *
   * @default {false}
   */
  priority?: boolean;
  /**
   * Alternative text description of the image.
   * Required for accessibility. Describes the image content for screen readers
   * and displays when the image fails to load.
   * @example alt="Picture of the author"
   */
  alt?: string;
  /**
   * Responsive size configuration for the image.
   * Defines how image width varies across different viewport sizes.
   * Uses standard HTML sizes attribute format.
   * @example sizes="(max-width: 768px) 100vw, 33vw"
   */
  sizes?: string;
  /**
   * CSS styles to apply to the image element.
   * Useful for controlling image display properties like object-fit.
   * @example style={{objectFit: "contain"}}
   */
  style?: CSSProperties;
  /**
   * Alternative source URL for SEO or specific use cases.
   * Overrides the main src when needed.
   * @example overrideSrc="/seo.png"
   */
  overrideSrc?: string;
  /**
   * Callback function that executes when the image finishes loading.
   * Receives the loaded image element as a parameter.
   * @example onLoadingComplete={img => done())}
   */
  onLoadingComplete?: (img: HTMLImageElement) => void;
  /**
   * Callback function that executes when the image load event fires.
   * @example onLoad={event => done())}
   */
  onLoad?: (event: React.SyntheticEvent<HTMLImageElement>) => void;
  /**
   * Callback function that executes if the image fails to load.
   * @example onError(event => fail()}
   */
  onError?: (event: React.SyntheticEvent<HTMLImageElement>) => void;
}
