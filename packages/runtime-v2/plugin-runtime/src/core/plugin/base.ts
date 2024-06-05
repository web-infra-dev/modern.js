import {
  createManager,
  createPipeline,
  createAsyncPipeline,
  PluginOptions,
  Setup,
} from '@modern-js/plugin';

import { RuntimeContext } from '../context/runtime';

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
  RuntimeContext
>();

const runtimeHooks = {
  hoc,
  init,
};

/** Plugin options of a runtime plugin. */
export type Plugin = PluginOptions<RuntimeHooks, Setup<RuntimeHooks>>;

/** All hooks of runtime plugin. */
type RuntimeHooks = typeof runtimeHooks;

const createRuntime = () => createManager(runtimeHooks);

export const runtime = createRuntime();

export type PluginRunner = ReturnType<typeof runtime.init>;
