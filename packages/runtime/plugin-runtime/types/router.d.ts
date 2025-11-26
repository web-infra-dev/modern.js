import type { RouterConfig } from '../dist/types';
import '../dist/types/router';

declare module '@modern-js/runtime' {
  interface RuntimeConfig {
    router?: Partial<RouterConfig>;
  }
}
