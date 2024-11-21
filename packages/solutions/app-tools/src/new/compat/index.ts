import type { InternalContext, Plugin } from '@modern-js/plugin-v2/types';
import type {
  AppToolsNormalizedConfig,
  AppToolsUserConfig,
} from '../../types/config';
import type { AppTools, AppToolsExtendAPIName } from '../types';
import { getHookRunners } from './hooks';

export const compatPlugin = (): Plugin<
  AppTools<'shared'>,
  InternalContext<
    AppToolsUserConfig<'shared'>,
    AppToolsNormalizedConfig,
    AppToolsExtendAPIName<'shared'>
  >
> => ({
  name: '@modern-js/app-tools-compat',
  _registryApi: (getAppContext, updateAppContext) => {
    const getInternalContext = () => {
      return getAppContext()._internalContext!;
    };
    return {
      useAppContext: () => {
        return getAppContext();
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
  setup: _api => {},
});
