import type { ReactNode } from 'react';
import type { RootOptions, HydrationOptions } from 'react-dom/client';
import { createRoot, hydrateRoot } from 'react-dom/client';
import { getRenderDataStore as getStore } from './deferred';
import type { RenderDataHost, RenderDataStore } from './deferred';

export { readDataScript } from './data';

export type { RenderDataHost } from './deferred';

export function getRenderDataStore(
  host: RenderDataHost = globalThis as RenderDataHost,
): RenderDataStore {
  return getStore(host);
}

export function hydrateRenderRoot(
  container: Element | Document,
  children: ReactNode,
  options?: HydrationOptions,
) {
  return hydrateRoot(container, children, options);
}

export function createRenderRoot(container: Element, options?: RootOptions) {
  return createRoot(container, options);
}
