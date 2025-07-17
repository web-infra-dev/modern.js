import type { PluginHook } from '../hooks';
import type { Plugin } from '../plugin';
import type { ServerPluginAPI } from './api';
import type { ServerContext } from './context';

export interface ServerPluginExtends<
  Config extends Record<string, any> = {},
  ExtendContext extends Record<string, any> = {},
  ExtendAPI extends Record<string, any> = {},
  ExtendHook extends Record<string, PluginHook<(...args: any[]) => any>> = {},
> {
  config?: Config;
  extendContext?: ExtendContext;
  extendApi?: ExtendAPI;
  extendHooks?: ExtendHook;
}

/**
 * The type of the Server plugin object.
 */
export type ServerPlugin<Extends extends ServerPluginExtends> = Plugin<
  ServerPluginAPI<Extends> & Extends['extendApi'],
  ServerContext<Extends> & Extends['extendContext']
>;
