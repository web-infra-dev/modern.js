import { createReadableStreamFromElement } from './createReadableStream';
import { createRenderStreaming } from './shared';

export const renderStreaming = createRenderStreaming(
  createReadableStreamFromElement,
);
