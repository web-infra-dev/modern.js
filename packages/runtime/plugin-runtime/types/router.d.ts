import { RouterConfig } from '../dist/types';
import '../dist/types/router';

declare module '@modern-js/app-tools' {
  interface RuntimeUserConfig {
    router?: Partial<RouterConfig> | boolean;
  }
}

declare module '@modern-js/module-tools' {
  interface RuntimeUserConfig {
    router?: Partial<RouterConfig> | boolean;
  }
}
