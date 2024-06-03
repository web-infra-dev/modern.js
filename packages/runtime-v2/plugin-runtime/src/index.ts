import { RouterConfig } from './router/runtime';
import { Plugin } from './core/plugin';
import { StateConfig } from './state/runtime';

interface RuntimeConfig {
  router?: boolean | Partial<RouterConfig>;
  state?: boolean | StateConfig;
  plugins: Plugin[];
}
/**
 * This function helps you to autocomplete configuration types.
 * It accepts a direct config object, or a function that returns a config.
 */
export const defineConfig = (config: RuntimeConfig) => config;
