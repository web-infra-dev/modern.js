import type { StateConfig } from './state';

export const isBrowser = () =>
  typeof window !== 'undefined' && window.name !== 'nodejs';

export interface AppConfig {
  state?: StateConfig | boolean;
  [key: string]: any;
}
