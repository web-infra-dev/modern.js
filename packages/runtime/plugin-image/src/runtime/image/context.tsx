import type { ImageContext } from '@/types/image';
import { type PropsWithChildren, createContext, useContext } from 'react';

export function createImageOptionsContext() {
  const ret: ImageContext = {};
  if (typeof __INTERNAL_MODERNJS_IMAGE_OPTIONS__ !== 'undefined') {
    Object.assign(ret, __INTERNAL_MODERNJS_IMAGE_OPTIONS__);
  }
  return ret;
}

export const ImageOptionsContext = createContext<ImageContext>(
  createImageOptionsContext(),
);

export interface ImageOptionsProviderProps extends PropsWithChildren {
  value: ImageContext;
}

export function ImageOptionsProvider(props: ImageOptionsProviderProps) {
  const { value, children } = props;
  const inherited = useContext(ImageOptionsContext);
  return (
    <ImageOptionsContext.Provider value={{ ...inherited, ...value }}>
      {children}
    </ImageOptionsContext.Provider>
  );
}
