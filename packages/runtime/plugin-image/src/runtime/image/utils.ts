export interface HTMLImageElementWithLoadedMark extends HTMLImageElement {
  'data-loaded-src'?: string;
}

/**
 * This implementation is based on code from [Next.js](https://github.com/vercel/next.js/blob/ed10f7ed0246fcc763194197eb9beebcbd063162/packages/next/src/client/image-component.tsx#L60-L167)
 * which is licensed under the MIT License.
 */
export async function createLoadEvent(img: HTMLImageElementWithLoadedMark) {
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
