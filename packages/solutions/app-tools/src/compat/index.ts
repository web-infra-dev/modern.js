import { createAsyncHook, createCollectAsyncHook } from '@modern-js/plugin-v2';
import type { Entrypoint } from '@modern-js/types';
import type { AppTools, CliPluginFuture } from '../types';
import { getHookRunners } from './hooks';

type AppendEntryCodeFn = (params: {
  entrypoint: Entrypoint;
  code: string;
}) => string | Promise<string>;
type JestConfigFn = (
  utils: any,
  next: (utils: any) => any,
) => void | Promise<void>;
type AfterTestFn = () => void | Promise<void>;

export const compatPlugin = (): CliPluginFuture<AppTools<'shared'>> => ({
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
    appendEntryCode: createCollectAsyncHook<AppendEntryCodeFn>(),
    jestConfig: createAsyncHook<JestConfigFn>(),
    afterHest: createAsyncHook<AfterTestFn>(),
  },
  setup: api => {
    api.updateAppContext({
      toolsType: 'app-tools',
    });
  },
});
