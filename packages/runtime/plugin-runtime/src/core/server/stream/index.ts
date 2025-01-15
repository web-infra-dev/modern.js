import { createRenderStreaming } from './shared';

// If this code is in the getCreateReadableStream function, after compilation of module-tools, it will affect the DCE optimization of webpack.
const createReadableStreamFromElement =
  process.env.MODERN_SSR_ENV === 'edge'
    ? import('./createReadableStream.worker').then(
        m => m.createReadableStreamFromElement,
      )
    : import('./createReadableStream').then(
        m => m.createReadableStreamFromElement,
      );

const getCreateReadableStream = async () => {
  return createReadableStreamFromElement;
};

export const renderStreaming = createRenderStreaming(getCreateReadableStream());
