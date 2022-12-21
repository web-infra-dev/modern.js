import { RouterConfig } from '../dist/types';
import '../dist/types/router';

declare module '@modern-js/app-tools' {
  interface RuntimeUserConfig {
    router?: RouterConfig | boolean;
  }
}

declare module '@modern-js/runtime' {
  interface AppConfig {
    router?: RouterConfig | boolean;
  }
}
