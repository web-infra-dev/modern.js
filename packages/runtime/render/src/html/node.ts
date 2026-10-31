import type { ReactNode } from 'react';
import { renderToPipeableStream } from 'react-dom/server';

export type PipeableRenderOptions = NonNullable<
  Parameters<typeof renderToPipeableStream>[1]
> & {
  onTiming?: (phase: 'shell' | 'all', duration: number) => void;
};

export function renderPipeableElement(
  element: ReactNode,
  options: PipeableRenderOptions = {},
) {
  const { onTiming, onShellReady, onAllReady, ...rest } = options;
  const started = performance.now();
  return renderToPipeableStream(element, {
    ...rest,
    onShellReady() {
      onTiming?.('shell', performance.now() - started);
      onShellReady?.();
    },
    onAllReady() {
      onTiming?.('all', performance.now() - started);
      onAllReady?.();
    },
  });
}
