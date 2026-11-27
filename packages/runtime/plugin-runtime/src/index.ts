import type { RouterConfig } from './router/internal';
import type {
  MemoryRouteEntry,
  MemoryRouterConfig,
  MemoryRouterOptions,
} from './router/runtime/types';

export type { RuntimePlugin } from './core';
export type { RuntimeConfig } from './common';
export { isBrowser } from './common';

export type { TRuntimeContext } from './core/context/runtime';

export { getMonitors } from './core/context/monitors';
export { getRequest } from './core/context/request';
export { setHeaders, setStatus, redirect } from './core/context/response';

export { RuntimeContext, defineRuntimeConfig, useRuntimeContext } from './core';

export type {
  MemoryRouteEntry,
  MemoryRouterConfig,
  MemoryRouterOptions,
  RouterConfig,
};
