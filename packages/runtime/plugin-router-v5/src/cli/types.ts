import { RouterConfig } from '../runtime/plugin';

declare module '@modern-js/app-tools' {
  export interface RuntimeUserConfig {
    router?: RouterConfig | boolean;
  }
}
