import type { Plugin } from '@modern-js/plugin-v2';
import type { InternalRuntimeContext } from '@modern-js/plugin-v2/runtime';
import { runtime } from '@modern-js/plugin-v2/runtime';
import { merge } from '@modern-js/runtime-utils/merge';
import { compatPlugin } from '../compat';
import { handleSetupResult } from '../compat/hooks';
import { requestContextPlugin } from '../compat/requestContext';
import { setGlobalInternalRuntimeContext } from '../context';
import type {
  RuntimeConfig,
  RuntimeExtends,
  RuntimePluginFuture,
} from './types';

// new type
export type { RuntimePluginFuture };

export function registerPlugin(
  internalPlugins: RuntimePluginFuture[],
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
