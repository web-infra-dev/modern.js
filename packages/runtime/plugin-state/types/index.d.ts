import type { StateConfig } from '../dist/types';
import '@modern-js-reduck/plugin-auto-actions';
import '@modern-js-reduck/plugin-devtools';
import '@modern-js-reduck/plugin-effects';
import '@modern-js-reduck/plugin-immutable';

export { default } from '../dist/types/runtime';
export * from '../dist/types/runtime';

declare module '@modern-js/runtime/model' {
  export * from '../dist/types/runtime';
}

declare module '@modern-js/runtime' {
  interface AppConfig {
    state?: StateConfig;
  }

  interface RuntimeConfig {
    state?: StateConfig;
  }
}
declare module '@modern-js/app-tools' {
  interface RuntimeUserConfig {
    state?: StateConfig | boolean;
  }
}
