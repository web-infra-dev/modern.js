import '@modern-js/plugin-router-v5';
import { Config } from './dist/types';
declare module '@modern-js/runtime/garfish' {
  export const useModuleApp: typeof import('./dist/types/runtime').useModuleApp;
  export const useModuleApps: typeof import('./dist/types/runtime').useModuleApps;
}

declare module '@modern-js/runtime' {
  interface AppConfig {
    masterApp?: Config;
  }
}
declare module '@modern-js/app-tools' {
  interface RuntimeUserConfig {
    masterApp?: Config;
  }
}
