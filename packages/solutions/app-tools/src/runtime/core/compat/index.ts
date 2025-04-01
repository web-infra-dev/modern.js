import type { RuntimePluginFuture } from '../plugin/types';
import { getHookRunners } from './hooks';

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
});
