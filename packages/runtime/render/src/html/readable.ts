import type { ReactNode } from 'react';
import type { renderToReadableStream } from 'react-dom/server';

export type ReadableRenderOptions = NonNullable<
  Parameters<typeof renderToReadableStream>[1]
> & {
  onTiming?: (phase: 'shell' | 'all', duration: number) => void;
};

export async function renderReadableWith(
  render: typeof renderToReadableStream,
  element: ReactNode,
  options: ReadableRenderOptions,
) {
  const { onTiming, ...rest } = options;
  const started = performance.now();
  const stream = await render(element, rest);
  onTiming?.('shell', performance.now() - started);
  // The original allReady remains observable by its owner on errors.
  void stream.allReady.then(
    () => onTiming?.('all', performance.now() - started),
    () => undefined,
  );
  return stream;
}
