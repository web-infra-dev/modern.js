import {
  type PluginOptions,
  type Setup,
  createAsyncInterruptWorkflow,
  createSyncParallelWorkflow,
  createWaterfall,
} from '@modern-js/plugin';

import type { RuntimeContext, TRuntimeContext } from '../context/runtime';
import type { RuntimeConfig } from './types';

// biome-ignore lint/suspicious/noEmptyInterface: <explanation>
export interface AppProps {}

const wrapRoot = createWaterfall<React.ComponentType<any>>();

const beforeRender = createAsyncInterruptWorkflow<RuntimeContext, void>();

/**
 * To add runtime info to runtime context
 */
const pickContext = createWaterfall<TRuntimeContext>();

const modifyRuntimeConfig = createSyncParallelWorkflow<
  void,
  Record<string, any>
>();

const runtimeHooks = {
  beforeRender,
  wrapRoot,
  pickContext,
  modifyRuntimeConfig,
};

/** All hooks of runtime plugin. */
export type RuntimeHooks = typeof runtimeHooks;

export type RuntimePluginAPI = { useRuntimeConfigContext: () => RuntimeConfig };

/** Plugin options of a runtime plugin. */
export type Plugin = PluginOptions<
  RuntimeHooks,
  Setup<RuntimeHooks, RuntimePluginAPI>
>;
