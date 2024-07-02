import {
  createManager,
  createPipeline,
  createAsyncPipeline,
  PluginOptions,
  Setup,
} from '@modern-js/plugin';

import { RuntimeContext, TRuntimeContext } from '../context/runtime';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface AppProps {}

const hoc = createPipeline<
  {
    App: React.ComponentType<any>;
    config: Record<string, any>;
  },
  React.ComponentType<any>
>();

const init = createAsyncPipeline<
  {
    context: RuntimeContext;
  },
  unknown
>();

/**
 * To add runtime info to runtime context
 */
const pickContext = createPipeline<
  { context: RuntimeContext; pickedContext: TRuntimeContext },
  TRuntimeContext
>();

const runtimeHooks = {
  hoc,
  init,
  pickContext,
};

/** All hooks of runtime plugin. */
export type RuntimeHooks = typeof runtimeHooks;

/** Plugin options of a runtime plugin. */
export type Plugin = PluginOptions<RuntimeHooks, Setup<RuntimeHooks>>;

export const createRuntime = () => createManager(runtimeHooks);

export const runtime = createRuntime();

export type PluginRunner = ReturnType<typeof runtime.init>;
