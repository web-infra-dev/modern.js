import { RouterConfig } from '../dist/types';
import '../dist/types/router';

declare module '@modern-js/core/config' {
  interface RuntimeConfig {
    router?: RouterConfig | boolean;
  }
}

declare module '@modern-js/runtime/router' {
  export * from '../dist/types/router';
}

declare module '@modern-js/runtime' {
  interface AppConfig {
    router?: RouterConfig | boolean;
  }
}
