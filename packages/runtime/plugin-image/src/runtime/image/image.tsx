import type { ImageProps } from '@/types/image';
import { forwardRef, useState } from 'react';
import { resolveImageAttrs } from './attrs';
import { resolveImageProps } from './props';
import { type HTMLImageElementWithLoadedMark, createLoadEvent } from './utils';

/** @internal */
export interface DebuggableImageProps extends ImageProps {
  beforeRef?: (img: HTMLImageElement | null) => void;
}

export const Image = forwardRef<HTMLImageElement, ImageProps>((props, ref) => {
  const [blurComplete, setBlurComplete] = useState(false);

  const resolvedProps = resolveImageProps(props);
  if (blurComplete) resolvedProps.placeholder = false;
  const attrs = resolveImageAttrs(resolvedProps);

  const handleLoad = (e?: React.SyntheticEvent<HTMLImageElement>) => {
    if (!e) return;

    if (typeof resolvedProps.placeholder === 'string') {
      setBlurComplete(true);
    }
    resolvedProps.onLoad?.(e);
  };

  const tryHandleLoad: ImageProps['onLoad'] = e => {
    const img = e.currentTarget as HTMLImageElementWithLoadedMark;
    createLoadEvent(img).then(handleLoad);
  };

  const handleError: ImageProps['onError'] = e => {
    resolvedProps.placeholder && setBlurComplete(true);
    props.onError?.(e);
  };

  const handleRef = (img: HTMLImageElement | null) => {
    if (IS_TEST) {
      (resolvedProps as DebuggableImageProps).beforeRef?.(img);
    }
    if (img) {
      if (resolvedProps.onError) {
        /* biome-ignore lint/correctness/noSelfAssign:
         * If the image has an error before react hydrates, then the error is lost.
         * The workaround is to wait until the image is mounted which is after hydration,
         * then we set the src again to trigger the error handler (if there was an error).
         */
        img.src = img.src;
      }
      img.complete && createLoadEvent(img).then(handleLoad);
    }

    // Trigger the forwarded ref.
    if (typeof ref === 'function') ref(img);
    else if (ref) ref.current = img;
  };

  return (
    <img
      {...attrs}
      ref={handleRef}
      onLoad={tryHandleLoad}
      onError={handleError}
    />
  );
});
