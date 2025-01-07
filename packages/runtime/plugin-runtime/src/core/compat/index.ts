import { createSyncHook } from '@modern-js/plugin-v2';
import type { RuntimePlugin } from '../plugin/types';
import { getHookRunners } from './hooks';

type ModifyRoutesFn = (routes: any) => any;

export const compatPlugin = (): RuntimePlugin => ({
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
  },
});
