import { useContext } from 'react';
import { GarfishContext } from './utils/Context';

export function useModuleApps() {
  const { apps } = useContext(GarfishContext);

  return apps;
}

export function useModuleApp() {
  const { MApp } = useContext(GarfishContext);

  return MApp;
}

export function useLegacyModuleApps() {
  const { MApp, appInfoList, apps } = useContext(GarfishContext);
  return {
    MApp,
    apps: appInfoList,
    appComponents: apps,
  };
}
