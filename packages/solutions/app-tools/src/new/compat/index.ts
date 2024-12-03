import { createCollectAsyncHook } from '@modern-js/plugin-v2';
import type { Entrypoint } from '@modern-js/types';
import type { AppTools, CliPluginFuture } from '../../types';
import { getHookRunners } from './hooks';

type AppendEntryCodeFn = (params: {
  entrypoint: Entrypoint;
  code: string;
}) => string | Promise<string>;

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
  },
  setup: api => {
    api.updateAppContext({
      toolsType: 'app-tools',
    });
  },
});
