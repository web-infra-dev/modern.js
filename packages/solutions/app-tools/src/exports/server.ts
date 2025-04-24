import type { UnstableMiddlewareContext, UnstableNext } from '@modern-js/types';

export type { ServerPlugin, ServerPluginLegacy } from '@modern-js/server-core';

export type RenderMiddlewareContext = UnstableMiddlewareContext;

export type RenderNext = UnstableNext;

export { defineServerConfig as defineConfig } from '../utils/config';
