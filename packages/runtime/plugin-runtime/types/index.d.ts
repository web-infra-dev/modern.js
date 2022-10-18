import { StateConfig } from '../dist/types';

declare module '@modern-js/core/config' {
  interface RuntimeConfig {
    state?: StateConfig | boolean;
  }
}

declare module 'http' {
  interface ServerResponse {
    locals: Record<string, any>;
  }
}
