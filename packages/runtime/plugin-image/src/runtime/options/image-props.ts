import type { Merge } from 'type-fest';
import type { ImageComponentContext, ImageProps } from '../../shared/options';
import { resolveImageComponentContext } from './image-component-context';
import { resolveImageOptions } from './image-options';

export function resolveImageProps(props: ImageProps) {
  const { alt = '', priority = false, onError, onLoad, ...rest } = props;
  let { loading } = props;

  if (priority === true) {
    if (loading === 'lazy') {
      throw new Error(
        'Can\'t use priority={true} and loading="lazy" at the same time, please only use one of them.',
      );
    }
  } else {
    loading ||= 'lazy';
  }

  const ret = {
    ...resolveImageComponentContext(rest),
    ...resolveImageOptions(rest),
    alt,
    priority,
    onLoad,
    onError,
    loading,
  };

  return ret;
}

export interface ResolvedImageProps
  extends Merge<ImageProps, ReturnType<typeof resolveImageProps>> {}
