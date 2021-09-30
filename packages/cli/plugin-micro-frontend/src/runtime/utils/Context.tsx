import React from 'react';

export interface GarfishContextType {
  MApp: React.FC<any>;
  apps: Record<string, React.ComponentType<any>>;
}

const GarfishContext = React.createContext<GarfishContextType>(null as any);
const GarfishProvider = GarfishContext.Provider;

export { GarfishContext, GarfishProvider };
