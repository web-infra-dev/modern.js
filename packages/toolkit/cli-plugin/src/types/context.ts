import type { Hooks } from '../hooks';
import type { CLIPluginAPI } from './api';

/** The public context */
export type AppContext = {};

/** The inner context. */
export type InternalContext<Config = {}, NormalizedConfig = {}> = AppContext & {
  /** All hooks. */
  hooks: Readonly<Hooks>;
  /** Current App config. */
  config: Readonly<Config>;
  /** The normalized Rsbuild config. */
  normalizedConfig?: NormalizedConfig;
  /**
   * Get the plugin API.
   * */
  getPluginAPI?: (environment?: string) => CLIPluginAPI;
};
