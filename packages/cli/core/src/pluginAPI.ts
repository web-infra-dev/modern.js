import {
  AppContext,
  ConfigContext,
  ResolvedConfigContext,
  useAppContext,
  useConfigContext,
  useResolvedConfigContext,
} from './context';

export const pluginAPI = {
  useAppContext,
  useConfigContext,
  useResolvedConfigContext,
};

export type PluginAPI = typeof pluginAPI;

// TODO: only export types after refactor all plugins
export {
  AppContext,
  ConfigContext,
  ResolvedConfigContext,
  useAppContext,
  useConfigContext,
  useResolvedConfigContext,
};
