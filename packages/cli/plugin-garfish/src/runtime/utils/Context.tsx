import React from 'react';
import { ModulesInfo } from '../useModuleApps';

export interface GarfishContextType {
  MApp: React.FC<any>;
  apps: Record<string, React.FC<any>>;
  appInfoList: ModulesInfo;
}

const GarfishContext = React.createContext<GarfishContextType>(null as any);
const GarfishProvider = GarfishContext.Provider;

export { GarfishContext, GarfishProvider };
