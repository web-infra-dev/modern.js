import type { InternalRuntimeContext, Plugin } from '@modern-js/plugin-v2';
import { runtime } from '@modern-js/plugin-v2/runtime';
import { merge } from '@modern-js/runtime-utils/merge';
import { setGlobalInternalRuntimeContext } from '../context';
import type { RuntimeConfig, RuntimeExtends, RuntimePlugin } from './types';

// old type
export type { Plugin } from './base';

export function registerPlugin(
  internalPlugins: RuntimePlugin[],
  runtimeConfig?: RuntimeConfig,
  customRuntime?: typeof runtime,
) {
  const { plugins = [] } = runtimeConfig || {};
  const { runtimeContext } = (customRuntime || runtime).init({
    plugins: [...internalPlugins, ...plugins] as Plugin[],
    config: runtimeConfig || {},
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
