import { createReadableStreamFromElement } from './createReadableStream.node';
import { createRenderStreaming } from './shared';

export const renderStreaming = createRenderStreaming(
  createReadableStreamFromElement,
);
