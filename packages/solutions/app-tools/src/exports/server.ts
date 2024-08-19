import type {
  UnstableMiddleware,
  UnstableMiddlewareContext,
  UnstableNext,
} from '@modern-js/types';

export type { ServerPlugin } from '@modern-js/server-core';

export type RenderMiddleware = UnstableMiddleware;

export type RenderMiddlewareContext = UnstableMiddlewareContext;

export type RenderNext = UnstableNext;

export { defineServerConfig as defineConfig } from '../utils/config';
