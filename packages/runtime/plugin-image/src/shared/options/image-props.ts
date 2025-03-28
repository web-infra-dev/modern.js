import type { CSSProperties } from 'react';
import type { ImageResource } from '../../types/image';
import {
  type ImageComponentContext,
  createImageComponentContext,
} from './image-component-context';
import { type ImageOptions, createImageOptions } from './image-options';

/**
 * Configuration options for the Image component.
 * This interface provides a comprehensive set of properties to customize image rendering,
 * loading behavior, and optimization settings.
 */
export interface ImageProps extends ImageComponentContext, ImageOptions {
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
  alt: string;
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
   * Low-quality thumbnail to show while the main image loads.
   * Can be a base64 encoded image or an ImageResource object.
   * @example thumbnail="data:image/jpeg..."
   */
  thumbnail?: ImageResource;
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

export function createImageProps() {
  return {
    ...createImageComponentContext(),
    ...createImageOptions(),
    alt: '',
    src: '',
    priority: false,
  } satisfies ImageProps;
}
