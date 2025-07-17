import { createAsyncHook } from '@modern-js/plugin';
import type { AppTools, CliPluginFuture } from '../types';
import { getHookRunners } from './hooks';

type JestConfigFn = (
  utils: any,
  next: (utils: any) => any,
) => void | Promise<void>;
type AfterTestFn = () => void | Promise<void>;

export const compatPlugin = (): CliPluginFuture<AppTools> => ({
  name: '@modern-js/app-tools-compat',
  _registryApi: (getAppContext, updateAppContext) => {
    const getInternalContext = () => {
      return getAppContext()._internalContext!;
    };
    return {
      useAppContext: () => {
        const { _internalContext, ...appContext } = getAppContext();
        return appContext;
      },
      setAppContext: context => {
        return updateAppContext(context);
      },
      useConfigContext: () => {
        return getInternalContext().config;
      },
      useResolvedConfigContext: () => {
        return getInternalContext().normalizedConfig;
      },
      useHookRunners: () => {
        return getHookRunners(getInternalContext());
      },
    };
  },
  registryHooks: {
    jestConfig: createAsyncHook<JestConfigFn>(),
    afterTest: createAsyncHook<AfterTestFn>(),
  },
  setup: api => {
    api.updateAppContext({
      toolsType: 'app-tools',
    });
  },
});
