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
