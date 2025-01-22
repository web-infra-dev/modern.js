import type { PluginHook } from '../hooks';
import type { Plugin } from '../plugin';
import type { CLIPluginAPI } from './api';
import type { AppContext } from './context';

export interface CLIPluginExtends<
  Config extends Record<string, any> = {},
  NormalizedConfig extends Record<string, any> = {},
  ExtendContext extends Record<string, any> = {},
  ExtendAPI extends Record<string, any> = {},
  ExtendHook extends Record<string, PluginHook<(...args: any[]) => any>> = {},
  ExtendBuildUtils extends Record<string, any> = {},
  ExtendConfigUtils extends Record<string, any> = {},
> {
  config?: Config;
  normalizedConfig?: NormalizedConfig;
  extendContext?: ExtendContext;
  extendApi?: ExtendAPI;
  extendHooks?: ExtendHook;
  extendBuildUtils?: ExtendBuildUtils;
  extendConfigUtils?: ExtendConfigUtils;
}

/**
 * The type of the CLI plugin object.
 */
export type CLIPlugin<Extends extends CLIPluginExtends> = Plugin<
  CLIPluginAPI<Extends> & Extends['extendApi'],
  AppContext<Extends> & Extends['extendContext']
>;
