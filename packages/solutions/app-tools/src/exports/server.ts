import {
  UnstableMiddleware,
  UnstableMiddlewareContext,
  UnstableNext,
} from '@modern-js/types';

export type RenderMiddleware = UnstableMiddleware;

export type RenderMiddlewareContext = UnstableMiddlewareContext;

export type RenderNext = UnstableNext;

export { defineServerConfig as defineConfig } from '../utils/config';
