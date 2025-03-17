import { createRenderStreaming } from './shared';

const createReadableStreamFromElement =
  process.env.MODERN_SSR_ENV === 'edge'
    ? import('./createReadableStream.worker').then(
        m => m.createReadableStreamFromElement,
      )
    : import('./createReadableStream').then(
        m => m.createReadableStreamFromElement,
      );

export const renderStreaming = createRenderStreaming(
  createReadableStreamFromElement,
);
