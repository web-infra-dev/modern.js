import type { ImageOptionsContext } from '../../runtime/image/context';
import type { ImageComponentContext } from './image-component-context';
import { type ImageContext, createImageContext } from './image-context';

/**
 * Serializable options for the Image component.
 * These options can be configured in the compile-time.
 * And will been serialized and passed to runtime.
 *
 * Used by {@link ImageOptionsContext} to provide default values.
 * These options can be overridden by the {@link ImageContext} and {@link ImageProps}.
 */
export interface ImageSerializableContext
  extends Omit<ImageComponentContext, 'loader'> {
  loader?: string;
}

export function createImageSerializableContext() {
  return {
    ...createImageContext(),
    loader: undefined,
  } satisfies ImageSerializableContext;
}
