import type { Plugin } from '@modern-js/plugin';
import type { InternalRuntimeContext } from '@modern-js/plugin/runtime';
import { runtime } from '@modern-js/plugin/runtime';
import { merge } from '@modern-js/runtime-utils/merge';
import { compatPlugin } from '../compat';
import { makeRequestContext } from '../context/runtime';
import { handleSetupResult } from '../compat/hooks';
import type { TInternalRuntimeContext } from '../context/runtime';
import type { RuntimeConfig, RuntimeExtends, RuntimePlugin } from './types';

export type { RuntimePlugin };
const noPlugins: RuntimePlugin[] = [];
export type RuntimeFactory = (
  context: TInternalRuntimeContext,
  plugins?: RuntimePlugin[],
) => ReturnType<typeof createRuntime>;
let defaultRuntimeFactory: RuntimeFactory | undefined;
export function registerRuntimeDefinition(factory: RuntimeFactory) {
  defaultRuntimeFactory = factory;
}
export function getRuntimeDefinition(): RuntimeFactory {
  if (!defaultRuntimeFactory)
    throw new Error('Modern application registry has not been imported');
  return defaultRuntimeFactory;
}

/** Create instance-local hooks and context without replacing the definition. */
export function createRuntime(
  internalPlugins: RuntimePlugin[],
  runtimeConfig?: RuntimeConfig,
  context?: TInternalRuntimeContext,
  instancePlugins: RuntimePlugin[] = noPlugins,
) {
  const { plugins = [] } = runtimeConfig || {};
  context ||= {} as TInternalRuntimeContext;
  const { ssrContext, requestContext } = context;
  if (
    !requestContext ||
    (ssrContext &&
      (requestContext.request !== ssrContext.request ||
        requestContext.response !== ssrContext.response))
  ) {
    context.requestContext = makeRequestContext(ssrContext);
  }
  context.context = context.requestContext;
  const { runtimeContext } = runtime.run({
    plugins: [
      ...instancePlugins,
      compatPlugin(),
      ...internalPlugins,
      ...plugins,
    ] as Plugin[],
    config: runtimeConfig || {},
    runtimeContext: context,
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
