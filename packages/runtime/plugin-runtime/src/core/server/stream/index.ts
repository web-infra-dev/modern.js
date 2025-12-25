import { createRenderStreaming } from './shared';

const createReadableStreamFromElement =
  process.env.MODERN_SSR_ENV !== 'edge' || process.env.MODERN_SSR_NODE_STREAM
    ? import('./createReadableStream').then(
        m => m.createReadableStreamFromElement,
      )
    : import('./createReadableStream.worker').then(
        m => m.createReadableStreamFromElement,
      );

export const renderStreaming = createRenderStreaming(
  createReadableStreamFromElement,
);
