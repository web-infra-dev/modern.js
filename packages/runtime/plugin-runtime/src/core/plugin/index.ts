import type { InternalRuntimeContext, Plugin } from '@modern-js/plugin-v2';
import { runtime } from '@modern-js/plugin-v2/runtime';
import { merge } from '@modern-js/runtime-utils/merge';
import { compatPlugin } from '../compat';
import { handleSetupResult } from '../compat/hooks';
import { setGlobalInternalRuntimeContext } from '../context';
import type { Plugin as RuntimePlugin } from './base';
import type {
  RuntimeConfig,
  RuntimeExtends,
  RuntimePluginFuture,
} from './types';

// old type
export type { Plugin } from './base';
// new type
export type { RuntimePluginFuture };

export function registerPlugin(
  internalPlugins: (RuntimePlugin | RuntimePluginFuture)[],
  runtimeConfig?: RuntimeConfig,
) {
  const { plugins = [] } = runtimeConfig || {};
  const { runtimeContext } = runtime.run({
    plugins: [compatPlugin(), ...internalPlugins, ...plugins] as Plugin[],
    config: runtimeConfig || {},
    handleSetupResult,
  });
  setGlobalInternalRuntimeContext(
    runtimeContext as unknown as InternalRuntimeContext<RuntimeExtends>,
  );
  return runtimeContext;
}

export function mergeConfig(
  config: Record<string, any>,
  ...otherConfig: Record<string, any>[]
) {
  return merge({}, config, ...otherConfig);
}
