import type { ReactNode } from 'react';
import { renderToReadableStream } from 'react-dom/server.browser';
import { renderReadableWith } from './readable';
import type { ReadableRenderOptions } from './readable';

export type { ReadableRenderOptions } from './readable';

export async function renderReadableElement(
  element: ReactNode,
  options: ReadableRenderOptions = {},
) {
  return renderReadableWith(renderToReadableStream, element, options);
}
