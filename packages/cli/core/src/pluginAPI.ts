import type { CommonAPI } from '@modern-js/plugin';
import type { CliHooks } from './manager';
import {
  AppContext,
  ConfigContext,
  setAppContext,
  useAppContext,
  useConfigContext,
  ResolvedConfigContext,
  useResolvedConfigContext,
} from './context';

export const pluginAPI = {
  setAppContext,
  useAppContext,
  useConfigContext,
  useResolvedConfigContext,
};

export type { IAppContext } from '@modern-js/types';

/** all apis for cli plugin */
export type PluginAPI<ExtendHooks = Record<string, any>> = typeof pluginAPI &
  CommonAPI<CliHooks & ExtendHooks>;

// TODO: only export types after refactor all plugins
export {
  AppContext,
  ConfigContext,
  ResolvedConfigContext,
  useAppContext,
  useConfigContext,
  useResolvedConfigContext,
};
