export { createPlugin, createRuntime, runtime, registerInit } from './plugin';

export type { Plugin } from './plugin';

export { defineConfig, getConfig } from './appConfig';

// compatible
export * from './compatible';

export type { TRuntimeContext, RuntimeContext } from '../runtimeContext';
export { RuntimeReactContext, ServerRouterContext } from '../runtimeContext';
export * from './loader';

export type { SSRData, SSRContainer } from './types';

export * from '@modern-js/plugin';
