import type { StateConfig } from './state';
import type { RouterConfig } from './router';

export const isBrowser = () =>
  typeof window !== 'undefined' && window.name !== 'nodejs';

export interface AppConfig {
  router?: RouterConfig | boolean;
  state?: StateConfig | boolean;
  [key: string]: any;
}
