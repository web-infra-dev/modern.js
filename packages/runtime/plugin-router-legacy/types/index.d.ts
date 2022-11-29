import { RouterConfig } from '../dist/types';
import '../dist/types/runtime';

declare module '@modern-js/app-tools' {
  export interface RuntimeUserConfig {
    router?: RouterConfig | boolean;
  }
}

declare module '@modern-js/runtime/legacy-router' {
  export * from '../dist/types/runtime';
}

declare module '@modern-js/runtime' {
  interface AppConfig {
    router?: RouterConfig | boolean;
  }
}
