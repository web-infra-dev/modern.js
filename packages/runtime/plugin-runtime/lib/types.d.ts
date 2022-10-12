/// <reference path="../dist/types/index.d.ts" />

import { RouterConfig, StateConfig } from '../dist/types';
import '../dist/types/router/index';

declare module '@modern-js/core' {
  interface RuntimeConfig {
    router?: RouterConfig | boolean;
    state?: StateConfig | boolean;
  }
}

declare module 'http' {
  interface ServerResponse {
    locals: Record<string, any>;
  }
}

declare module '@modern-js/runtime/router' {
  export * from '../dist/types/router/index';
}
