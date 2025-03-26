import type { StateConfig } from '../dist/types';
import '@modern-js-reduck/plugin-auto-actions';
import '@modern-js-reduck/plugin-devtools';
import '@modern-js-reduck/plugin-effects';
import '@modern-js-reduck/plugin-immutable';

/**
 * This type file defines the runtime types for the runtime plugin, which will be referenced in the user's project at `src/modern-app-env.d.ts`.
 * The CLI type definitions for the runtime plugin are located in cli/types, which are used for type hints in modern.config.ts.
 * cli/types cannot be defined in this types file because the types from `src/modern-app-env.d.ts` cannot be used in `modern.config.ts`.
 */
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
