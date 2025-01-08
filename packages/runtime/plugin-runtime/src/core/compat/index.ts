import { createAsyncInterruptHook, createSyncHook } from '@modern-js/plugin-v2';
import type { RuntimeContext } from '../context';
import type { RuntimePluginFuture } from '../plugin/types';
import { getHookRunners } from './hooks';

type ModifyRoutesFn = (routes: any) => any;

type BeforeCreateRoutesFn = (context: RuntimeContext) => any;

export const compatPlugin = (): RuntimePluginFuture => ({
  name: '@modern-js/runtime-plugin-compat',
  _registryApi: getRuntimeContext => {
    return {
      useRuntimeConfigContext: () => {
        const { _internalContext } = getRuntimeContext();
        return _internalContext.config;
      },
      useHookRunners: () => {
        return getHookRunners(getRuntimeContext());
      },
    };
  },
  registryHooks: {
    modifyRoutes: createSyncHook<ModifyRoutesFn>(),
    beforeCreateRoutes: createAsyncInterruptHook<BeforeCreateRoutesFn>(),
  },
});
