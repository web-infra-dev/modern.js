import type { StateConfig } from './dist/types';

declare module '@modern-js/runtime' {
  interface AppConfig {
    state?: StateConfig;
  }

  interface RuntimeConfig {
    state?: StateConfig;
  }
}
declare module '@modern-js/app-tools' {
  interface RuntimeUserConfig {
    state?: StateConfig;
  }
}
