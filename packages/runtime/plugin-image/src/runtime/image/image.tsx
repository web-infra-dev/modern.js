import { forwardRef, useState } from 'react';
import type { ImageProps } from '../../shared/options';
import { resolveImageProps } from '../options/image-props';
import { resolveImageAttrs } from './attrs';

export interface HTMLImageElementWithLoadedMark extends HTMLImageElement {
  'data-loaded-src'?: string;
}

/**
 * This implementation is based on code from [Next.js](https://github.com/vercel/next.js/blob/ed10f7ed0246fcc763194197eb9beebcbd063162/packages/next/src/client/image-component.tsx#L60-L167)
 * which is licensed under the MIT License.
 */
async function createLoadEvent(img: HTMLImageElementWithLoadedMark) {
  const isLoaded = img['data-loaded-src'] === img.src;
  if (isLoaded) return;
  img['data-loaded-src'] = img.src;

  // Wait until the image is decoded.
  await Promise.resolve(img.decode?.()).catch(() => {});

  if (!img.parentElement || !img.isConnected) {
    // Exit early in case of race condition:
    // - onload() is called
    // - decode() is called but incomplete
    // - unmount is called
    // - decode() completes
    return;
  }

  // Since we don't have the SyntheticEvent here,
  // we must create one with the same shape.
  // See https://reactjs.org/docs/events.html
  const nativeEvent = new Event('load');
  Object.defineProperty(nativeEvent, 'target', { writable: false, value: img });
  let prevented = false;
  let stopped = false;
  const event: React.SyntheticEvent<HTMLImageElement> = {
    ...nativeEvent,
    nativeEvent,
    currentTarget: img,
    target: img,
    isDefaultPrevented: () => prevented,
    isPropagationStopped: () => stopped,
    persist: () => {},
    preventDefault: () => {
      prevented = true;
      nativeEvent.preventDefault();
    },
    stopPropagation: () => {
      stopped = true;
      nativeEvent.stopPropagation();
    },
  };

  if (process.env.NODE_ENV !== 'production') {
    // TODO: add warning for debugging.
  }

  return event;
}

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
