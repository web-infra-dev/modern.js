import type { ReactNode } from 'react';
import { renderToString } from 'react-dom/server';

export interface StringRenderOptions<T> {
  identifierPrefix?: string;
  collect?: () => T;
  onTiming?: (duration: number) => void;
}

/** Framework error policy stays with the caller, including control responses. */
export function renderStringElement<T = undefined>(
  element: ReactNode,
  { identifierPrefix, collect, onTiming }: StringRenderOptions<T> = {},
): { html: string; collected: T | undefined } {
  const started = performance.now();
  const html = renderToString(element, { identifierPrefix });
  const collected = collect?.();
  onTiming?.(performance.now() - started);
  return { html, collected };
}
