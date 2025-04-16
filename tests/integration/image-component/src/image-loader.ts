import { type ImageLoader, ipxImageLoader } from '@modern-js/image/runtime';

export const customImageLoader: ImageLoader = args => {
  if (process.env.NODE_ENV === 'production') {
    const { src, width, quality } = args;
    return `${src}?w=${width}&q=${quality}`;
  }
  return ipxImageLoader(args);
};

export default customImageLoader;
