import type {
  AsyncInterruptWorkflow,
  PluginOptions,
  Setup,
  SyncParallelWorkflow,
  Waterfall,
} from '@modern-js/plugin';

import type { RuntimeContext, TRuntimeContext } from '../context/runtime';
import type { RuntimeConfig } from './types';

/** All hooks of runtime plugin. */
export type RuntimeHooks = {
  beforeRender: AsyncInterruptWorkflow<RuntimeContext, void>;
  wrapRoot: Waterfall<React.ComponentType<any>>;
  pickContext: Waterfall<TRuntimeContext>;
  modifyRuntimeConfig: SyncParallelWorkflow<void, Record<string, any>>;
};

export type RuntimePluginAPI = { useRuntimeConfigContext: () => RuntimeConfig };

/** Plugin options of a runtime plugin. */
export type Plugin = PluginOptions<
  RuntimeHooks,
  Setup<RuntimeHooks, RuntimePluginAPI>
>;
