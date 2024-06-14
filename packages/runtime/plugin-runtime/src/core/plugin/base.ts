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

/** TODO remove */
const client = createAsyncPipeline<
  {
    App: React.ReactElement<any>;
    readonly context: RuntimeContext;
    ModernRender: (App: React.ReactElement) => void;
    ModernHydrate: (App: React.ReactElement, callback?: () => void) => void;
  },
  any
>();

/** TODO remove */
const server = createAsyncPipeline<
  {
    App: React.ComponentType<any>;
    readonly context: RuntimeContext;
  },
  string
>();

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
  client,
  server,
  pickContext,
};

/** All hooks of runtime plugin. */
export type RuntimeHooks = typeof runtimeHooks;

/** Plugin options of a runtime plugin. */
export type Plugin = PluginOptions<RuntimeHooks, Setup<RuntimeHooks>>;

export const createRuntime = () => createManager(runtimeHooks);

export const runtime = createRuntime();

export type PluginRunner = ReturnType<typeof runtime.init>;
