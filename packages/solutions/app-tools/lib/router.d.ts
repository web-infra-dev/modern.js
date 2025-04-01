import type { RouterConfig } from '../dist/types/runtime';
import '../dist/types/runtime/router';

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

declare module '@modern-js/app-tools/runtime' {
  interface AppConfig {
    router?: Partial<RouterConfig> | boolean;
  }

  interface RuntimeConfig {
    router?: Partial<RouterConfig>;
  }
}
