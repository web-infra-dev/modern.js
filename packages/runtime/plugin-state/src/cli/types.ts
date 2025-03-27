import type { StateConfig } from '../runtime/plugin';

declare module '@modern-js/app-tools' {
  export interface RuntimeUserConfig {
    state?: StateConfig | boolean;
  }
}
