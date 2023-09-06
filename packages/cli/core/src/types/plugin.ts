import { AsyncSetup, PluginOptions } from '@modern-js/plugin';
import { BaseHooks } from './hooks';
import { BasePluginAPI } from './pluginAPI';

export type { InternalPlugins } from '@modern-js/types';

/** Plugin options of a cli plugin. */
export type CliPlugin<
  Extends extends {
    hooks?: ExtendHooks;
    userConfig?: ExtendUserConfig;
    normalizedConfig?: ExtendNormalizedConfig;
    // eslint-disable-next-line @typescript-eslint/ban-types
  } = {},
  // eslint-disable-next-line @typescript-eslint/ban-types
  ExtendHooks extends Record<string, any> = {},
  // eslint-disable-next-line @typescript-eslint/ban-types
  ExtendUserConfig extends Record<string, any> = {},
  // eslint-disable-next-line @typescript-eslint/ban-types
  ExtendNormalizedConfig extends Record<string, any> = {},
> = PluginOptions<
  BaseHooks<Extends>,
  AsyncSetup<BaseHooks<Extends> & Extends['hooks'], BasePluginAPI<Extends>>,
  Extends['hooks']
>;

export type PluginItem = string | [string, any];

/**
 * @deprecated
 * Using NewPluginConfig instead.
 */
export type OldPluginConfig = Array<PluginItem>;

/**
 * The type of PluginOptions is looser than the actual type,
 * this avoids potential type mismatch issues when using different version plugins.
 */
export type NewPluginConfig = PluginOptions<any, (...args: any[]) => void>[];

export type PluginConfig = OldPluginConfig | NewPluginConfig;
