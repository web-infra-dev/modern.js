import { PluginConfig } from '../plugin';

export type UserConfig<
  Extends extends {
    hooks?: ExtendHooks;
    userConfig?: ExtendUserConfig;
    normalizedConfig?: ExtendNormalizedConfig;
    // eslint-disable-next-line @typescript-eslint/ban-types
  } = {},
  // eslint-disable-next-line @typescript-eslint/ban-types
  ExtendHooks extends Record<string, any> = {},
  ExtendUserConfig extends {
    [property: string]: any;
    // eslint-disable-next-line @typescript-eslint/ban-types
  } = {},
  // eslint-disable-next-line @typescript-eslint/ban-types
  ExtendNormalizedConfig extends Record<string, any> = {},
> = {
  plugins?: PluginConfig<any>;

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
    // eslint-disable-next-line @typescript-eslint/ban-types
  } = {},
  // eslint-disable-next-line @typescript-eslint/ban-types
  ExtendHooks extends Record<string, any> = {},
  // eslint-disable-next-line @typescript-eslint/ban-types
  ExtendUserConfig extends Record<string, any> = {},
  ExtendNormalizedConfig extends {
    [property: string]: any;
    // eslint-disable-next-line @typescript-eslint/ban-types
  } = {},
> = {
  plugins: PluginConfig<any>;

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
    // eslint-disable-next-line @typescript-eslint/ban-types
  } = {},
  // eslint-disable-next-line @typescript-eslint/ban-types
  ExtendHooks extends {} = {},
  // eslint-disable-next-line @typescript-eslint/ban-types
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
