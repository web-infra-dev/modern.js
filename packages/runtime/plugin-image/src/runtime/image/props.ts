import type { ImageProps } from '@/types/image';
import { resolveImageOptions } from './options';

export function resolveImageProps(props: ImageProps) {
  const { priority = false, ...rest } = props;
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

  const resolved = {
    fill: false as boolean,
    priority: false as boolean,
    loading,
    ...rest,
    ...resolveImageOptions(props),
  } satisfies ImageProps & Record<string, any>;
  return resolved;
}

export interface ResolvedImageProps
  extends ReturnType<typeof resolveImageProps> {}
