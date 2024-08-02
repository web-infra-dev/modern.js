import { PluginConfig } from '../plugin';

export type UserConfig<
  Extends extends {
    hooks?: ExtendHooks;
    userConfig?: ExtendUserConfig;
    normalizedConfig?: ExtendNormalizedConfig;
  } = {},

  ExtendHooks extends Record<string, any> = {},
  ExtendUserConfig extends {
    [property: string]: any;
  } = {},

  ExtendNormalizedConfig extends Record<string, any> = {},
> = {
  plugins?: PluginConfig;

  /**
   * auto load plugin that exist in the package.json
   *
   * **default: `false`**
   */
  autoLoadPlugins?: boolean;
} & Omit<Extends['userConfig'], 'plugins'>;

export type NormalizedConfig<
  Extends extends {
    hooks?: ExtendHooks;
    userConfig?: ExtendUserConfig;
    normalizedConfig?: ExtendNormalizedConfig;
  } = {},
  ExtendHooks extends Record<string, any> = {},
  ExtendUserConfig extends Record<string, any> = {},
  ExtendNormalizedConfig extends {
    [property: string]: any;
  } = {},
> = {
  plugins: PluginConfig;
  /**
   * Auto load plugin that exist in the package.json
   *
   * **default: `false`**
   */
  autoLoadPlugins: boolean;
} & Omit<Extends['normalizedConfig'], 'plugins'>;

export type LoadedConfig<
  Extends extends {
    hooks?: ExtendHooks;
    userConfig?: ExtendUserConfig;
  } = {},
  ExtendHooks extends {} = {},
  ExtendUserConfig extends Record<string, any> = {},
> = {
  config: UserConfig<Extends>;
  filePath: string | false;
  dependencies: string[];
  pkgConfig: UserConfig<Extends>;
  jsConfig: UserConfig<Extends>;
};

export type ConfigParams = {
  env: string;
  command: string;
};

export type UserConfigExport<Config = UserConfig> =
  | Config
  | ((env: ConfigParams) => Config | Promise<Config>);
