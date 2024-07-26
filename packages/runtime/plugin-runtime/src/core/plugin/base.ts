import {
  createManager,
  createWaterfall,
  createAsyncInterruptWorkflow,
  createSyncParallelWorkflow,
  PluginOptions,
  Setup,
  createContext,
} from '@modern-js/plugin';

import { RuntimeContext, TRuntimeContext } from '../context/runtime';
import type { RuntimeConfig } from './index';

export const RuntimeConfigContext = createContext<
  Omit<RuntimeConfig, 'plugins'>
>({});

export const useRuntimeConfigContext = () => RuntimeConfigContext.use().value;

// eslint-disable-next-line @typescript-eslint/no-empty-interface
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

const runtimePluginAPI = {
  useRuntimeConfigContext,
};

/** All hooks of runtime plugin. */
export type RuntimeHooks = typeof runtimeHooks;

export type RuntimePluginAPI = typeof runtimePluginAPI;

/** Plugin options of a runtime plugin. */
export type Plugin = PluginOptions<
  RuntimeHooks,
  Setup<RuntimeHooks, RuntimePluginAPI>
>;

export const createRuntime = () =>
  createManager(runtimeHooks, runtimePluginAPI);

export const runtime = createRuntime();

export type PluginRunner = ReturnType<typeof runtime.init>;
