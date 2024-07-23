import {
  createManager,
  createWaterfall,
  createAsyncWaterfall,
  PluginOptions,
  Setup,
} from '@modern-js/plugin';

import { RuntimeContext, TRuntimeContext } from '../context/runtime';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface AppProps {}

const wrapRoot = createWaterfall<React.ComponentType<any>>();

const beforeRender = createAsyncWaterfall<RuntimeContext>();

/**
 * To add runtime info to runtime context
 */
const pickContext = createWaterfall<TRuntimeContext>();

const runtimeHooks = {
  beforeRender,
  wrapRoot,
  pickContext,
};

/** All hooks of runtime plugin. */
export type RuntimeHooks = typeof runtimeHooks;

/** Plugin options of a runtime plugin. */
export type Plugin = PluginOptions<RuntimeHooks, Setup<RuntimeHooks>>;

export const createRuntime = () => createManager(runtimeHooks);

export const runtime = createRuntime();

export type PluginRunner = ReturnType<typeof runtime.init>;
