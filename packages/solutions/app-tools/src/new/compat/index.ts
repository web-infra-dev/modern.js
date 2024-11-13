import type { InternalContext, Plugin } from '@modern-js/plugin-v2';
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
  registryApi: (context, updateAppContext) => {
    return {
      useAppContext: () => {
        return context;
      },
      setAppContext: context => {
        return updateAppContext(context);
      },
      useConfigContext: () => {
        return context.config;
      },
      useResolvedConfigContext: () => {
        return context.normalizedConfig;
      },
      useHookRunners: () => {
        return getHookRunners(context);
      },
    };
  },
  setup: _api => {},
});
