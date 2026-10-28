import type { Plugin } from '@modern-js/plugin';
import type { InternalRuntimeContext } from '@modern-js/plugin/runtime';
import { runtime } from '@modern-js/plugin/runtime';
import { merge } from '@modern-js/runtime-utils/merge';
import { compatPlugin } from '../compat';
import { handleSetupResult } from '../compat/hooks';
import { requestContextPlugin } from '../compat/requestContext';
import { setGlobalInternalRuntimeContext } from '../context';
import type { RuntimeConfig, RuntimeExtends, RuntimePlugin } from './types';

export type { RuntimePlugin };

export function registerPlugin(
  internalPlugins: RuntimePlugin[],
  runtimeConfig?: RuntimeConfig,
) {
  const runtimeContext = createRuntime(internalPlugins, runtimeConfig);
  setGlobalInternalRuntimeContext(runtimeContext);
  return runtimeContext;
}

/** Create an embedded instance without replacing the registered application. */
export function createRuntime(
  internalPlugins: RuntimePlugin[],
  runtimeConfig?: RuntimeConfig,
) {
  const { plugins = [] } = runtimeConfig || {};
  const { runtimeContext } = runtime.run({
    plugins: [
      compatPlugin(),
      requestContextPlugin(),
      ...internalPlugins,
      ...plugins,
    ] as Plugin[],
    config: runtimeConfig || {},
    handleSetupResult,
  });
  return runtimeContext as unknown as InternalRuntimeContext<RuntimeExtends>;
}

export function mergeConfig(
  config: Record<string, any>,
  ...otherConfig: Record<string, any>[]
) {
  return merge({}, config, ...otherConfig);
}
