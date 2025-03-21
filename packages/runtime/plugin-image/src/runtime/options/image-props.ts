import type { Merge } from 'type-fest';
import type { ImageProps } from '../../shared/options';
import { resolveImageComponentContext } from './image-component-context';
import { resolveImageOptions } from './image-options';

export function resolveImageProps(props: ImageProps) {
  const { alt = '', ...rest } = props;
  const ret = {
    ...resolveImageComponentContext(rest),
    ...resolveImageOptions(rest),
    alt,
  };
  return ret;
}

export interface ResolvedImageProps
  extends Merge<ImageProps, ReturnType<typeof resolveImageProps>> {}
