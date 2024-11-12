import type { InternalContext, Plugin } from '@modern-js/plugin-v2';
import type {
  AppToolsNormalizedConfig,
  AppToolsUserConfig,
} from '../../types/config';
import type { AppTools } from '../types';
import { getHookRunners } from './hooks';

export const compatPlugin = (): Plugin<
  AppTools<'shared'>,
  InternalContext<
    AppToolsUserConfig<'shared'>,
    AppToolsNormalizedConfig,
    keyof ReturnType<typeof getHookRunners>
  >
> => ({
  name: '@modern-js/app-tools-compat',
  registryApi: context => {
    return {
      useAppContext: () => {
        return context;
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
  setup: api => {
    api.onPrepare(() => {
      api.updateAppContext({
        command: 'compat',
      });
      const context = api.useAppContext();
      console.log('compat', context);
    });
  },
});
