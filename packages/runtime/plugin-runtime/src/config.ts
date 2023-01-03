import type { StateConfig } from './state';
import type { RouterConfig } from './router';

export interface RuntimeUserConfig {
  runtime?: {
    state?: boolean | StateConfig;
    router?: boolean | RouterConfig;
  };
}
