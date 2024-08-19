import type { RouterConfig } from '../dist/types';
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

declare module '@modern-js/runtime' {
  interface AppConfig {
    router?: Partial<RouterConfig> | boolean;
  }

  interface RuntimeConfig {
    router?: Partial<RouterConfig>;
    routerByEntries?: { [name: string]: Partial<RouterConfig> };
  }
}
