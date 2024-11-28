import type { Plugin } from '../plugin';
import type { CLIPluginAPI } from './api';
/**
 * The type of the CLI plugin object.
 */
export type CLIPlugin<Config, NormalizedConfig> = Plugin<
  CLIPluginAPI<Config, NormalizedConfig>
>;
