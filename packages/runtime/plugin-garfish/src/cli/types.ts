import { Config as MasterAppConfig } from '../runtime/useModuleApps';

declare module '@modern-js/app-tools' {
  interface RuntimeUserConfig {
    masterApp?: MasterAppConfig;
  }
}
