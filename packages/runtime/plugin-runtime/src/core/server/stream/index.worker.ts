import { createReadableStreamFromElement } from './createReadableStream.worker';
import { createRenderStreaming } from './shared';

export const renderStreaming = createRenderStreaming(
  createReadableStreamFromElement,
);
