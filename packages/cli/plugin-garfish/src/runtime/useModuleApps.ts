import garfish, { interfaces as GarfishInterfaces } from 'garfish';
import { useContext } from 'react';
import { logger } from '../util';
import { LoadingComponent } from './loadable';
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
  LoadingComponent?: LoadingComponent;
  componentKey?: string;
};

export type ModernGarfishConfig = {
  LoadingComponent?: LoadingComponent;
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
  logger('call useLegacyModuleApps', {
    MApp,
    apps: appInfoList,
    Components: apps,
  });
  return {
    MApp,
    apps: appInfoList,
    Components: apps,
  };
}
