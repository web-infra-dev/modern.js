import type { PluginHook } from '../hooks';
import type { Plugin } from '../plugin';
import type { RuntimePluginAPI } from './api';
import type { RuntimeContext } from './context';

export interface RuntimePluginExtends<
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
 * The type of the Runtime plugin object.
 */
export type RuntimePlugin<Extends extends RuntimePluginExtends> = Plugin<
  RuntimePluginAPI<Extends> & Extends['extendApi'],
  RuntimeContext & Extends['extendContext']
>;
