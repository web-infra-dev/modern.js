import { RouterConfig } from '../dist/types';
import '../dist/types/router';

declare module '@modern-js/app-tools' {
  export interface RuntimeUserConfig {
    router?: Partial<RouterConfig> | boolean;
  }
}

declare module '@modern-js/module-tools' {
  export interface RuntimeUserConfig {
    router?: RouterConfig | boolean;
  }
}

declare module '@modern-js/runtime' {
  interface AppConfig {
    router?: RouterConfig | boolean;
  }
}
