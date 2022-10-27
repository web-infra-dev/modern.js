import { RouterConfig } from '../dist/types';
import '../dist/types/runtime';

declare module '@modern-js/core/config' {
  interface RuntimeConfig {
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
