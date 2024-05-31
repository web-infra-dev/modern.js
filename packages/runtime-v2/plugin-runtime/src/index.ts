import { RouterConfig } from './router/runtime';
import { Plugin } from './runtime/plugin';

interface RuntimeConfig {
  router?: boolean | RouterConfig;
  plugins: Plugin[];
}
/**
 * This function helps you to autocomplete configuration types.
 * It accepts a direct config object, or a function that returns a config.
 */
export const defineConfig = (config: RuntimeConfig) => config;
