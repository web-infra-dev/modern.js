import type { RouterConfig } from './router/internal';

export interface RuntimeUserConfig {
  runtime?: {
    router?: boolean | RouterConfig;
  };
}
