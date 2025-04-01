import type { RouterConfig } from './router';

export interface RuntimeUserConfig {
  runtime?: {
    router?: boolean | RouterConfig;
  };
}
