import type { Merge } from 'type-fest';
import type { ImageProps } from '../../shared/options';
import { resolveImageComponentContext } from './image-component-context';
import { resolveImageOptions } from './image-options';

export function resolveImageProps(props: ImageProps) {
  const { alt = '', priority = false, onError, onLoad, ...rest } = props;

  const ret = {
    ...resolveImageComponentContext(rest),
    ...resolveImageOptions(rest),
    alt,
    priority,
    onLoad,
    onError,
  };

  return ret;
}

export interface ResolvedImageProps
  extends Merge<ImageProps, ReturnType<typeof resolveImageProps>> {}
