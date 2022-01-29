import garfish, { interfaces as GarfishInterfaces } from 'garfish';
import { useContext } from 'react';
import { logger } from '../util';
import { GarfishContext } from './utils/Context';

export type Options = typeof garfish.options;
export type ModuleInfo = GarfishInterfaces.AppInfo & {
  Component?: React.ComponentType | React.ElementType;
  originInfo?: Record<string, unknown>;
};
export type ModulesInfo = Array<ModuleInfo>;

export type Manifest = {
  modules?: ModulesInfo;
  getAppList?: () => Promise<Array<GarfishInterfaces.AppInfo>>;
  LoadingComponent?: React.ComponentType | React.ElementType;
  componentKey?: string;
};

export type ModernGarfishConfig = {
  manifest?: Manifest;
};

export type Config = Partial<Options> & ModernGarfishConfig;

export function useModuleApps() {
  const { apps } = useContext(GarfishContext);
  logger('call useModuleApps', apps);
  return apps;
}

export function useModuleApp() {
  const { MApp } = useContext(GarfishContext);
  logger('call useModuleApps', MApp);
  return MApp;
}

export function useLegacyModuleApps() {
  const { MApp, appInfoList, apps } = useContext(GarfishContext);
  logger('call useLegacyModuleApps', { MApp, appInfoList, apps });
  return {
    MApp,
    apps: appInfoList,
    Components: apps,
  };
}
