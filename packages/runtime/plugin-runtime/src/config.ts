import type { RouterConfig } from './router';
import type { StateConfig } from './state';

export interface RuntimeUserConfig {
  runtime?: {
    state?: boolean | StateConfig;
    router?: boolean | RouterConfig;
  };
}
