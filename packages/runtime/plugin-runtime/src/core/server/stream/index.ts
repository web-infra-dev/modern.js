import { createRenderStreaming } from './shared';

const getCreateReadableStream = async () => {
  const module =
    process.env.MODERN_SSR_ENV === 'edge'
      ? await import('./createReadableStream.worker')
      : await import('./createReadableStream');
  return module.createReadableStreamFromElement;
};

export const renderStreaming = createRenderStreaming(getCreateReadableStream());
