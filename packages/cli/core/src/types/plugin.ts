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
  Extends['hooks'],
  // eslint-disable-next-line @typescript-eslint/ban-types
  BaseHooks<Extends> | BaseHooks<{}>,
  | AsyncSetup<BaseHooks<Extends> & Extends['hooks'], BasePluginAPI<Extends>>
  // eslint-disable-next-line @typescript-eslint/ban-types
  | AsyncSetup<BaseHooks<{}>, BasePluginAPI<{}>>
>;

export type PluginItem = string | [string, any];

/**
 * @deprecated
 * Using NewPluginConfig instead.
 */
export type OldPluginConfig = Array<PluginItem>;

export type NewPluginConfig<
  PluginTypes extends {
    hooks?: Record<string, any>;
    userConfig?: Record<string, any>;
    normalizedConfig?: Record<string, any>;
  },
> = CliPlugin<PluginTypes>[];

export type PluginConfig<
  PluginTypes extends {
    hooks?: Record<string, any>;
    userConfig?: Record<string, any>;
    normalizedConfig?: Record<string, any>;
    // eslint-disable-next-line @typescript-eslint/ban-types
  } = {},
> = OldPluginConfig | NewPluginConfig<PluginTypes>;
