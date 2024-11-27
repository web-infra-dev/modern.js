import { createCollectAsyncHook } from '@modern-js/plugin-v2';
import type { CLIPlugin } from '@modern-js/plugin-v2/types';
import type { Entrypoint } from '@modern-js/types';
import type { AppTools } from '../../types';
import { getHookRunners } from './hooks';

type AppendEntryCodeFn = (params: {
  entrypoint: Entrypoint;
  code: string;
}) => string | Promise<string>;

export const compatPlugin = (): CLIPlugin<AppTools> => ({
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
  setup: _api => {},
});
