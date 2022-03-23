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
