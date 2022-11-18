import { PluginConfig } from '../plugin';
import type {
  BaseSourceNormalizedConfig,
  BaseSourceUserConfig,
} from './source';
import type {
  BaseTestingNormalizedConfig,
  BaseTestingUserConfig,
} from './testing';
import type { BaseToolsNormalizedConfig, BaseToolsUserConfig } from './tools';

export type {
  Jest as JestConfig,
  BaseTestingUserConfig as TestConfig,
} from './testing';

type DropUndefined<T> = T extends undefined ? never : T;

export type CliUserConfig<
  Extends extends {
    hooks?: ExtendHooks;
    userConfig?: ExtendUserConfig;
    normalizedConfig?: ExtendNormalizedConfig;
    // eslint-disable-next-line @typescript-eslint/ban-types
  } = {},
  // eslint-disable-next-line @typescript-eslint/ban-types
  ExtendHooks extends Record<string, any> = {},
  ExtendUserConfig extends {
    source?: Record<string, any>;
    tools?: Record<string, any>;
    testing?: Record<string, any>;
    [property: string]: any;
    // eslint-disable-next-line @typescript-eslint/ban-types
  } = {},
  // eslint-disable-next-line @typescript-eslint/ban-types
  ExtendNormalizedConfig extends Record<string, any> = {},
> = {
  source?: BaseSourceUserConfig<DropUndefined<Extends['userConfig']>['source']>;
  testing?: BaseTestingUserConfig<
    DropUndefined<Extends['userConfig']>['testing']
  >;
  /**
   * The configuration of `testing` is provided by `testing` plugin.
   * Please use `yarn new` or `pnpm new` to enable the corresponding capability.
   * @requires `testing` plugin
   */
  tools?: BaseToolsUserConfig<DropUndefined<Extends['userConfig']>['tools']>;
  plugins?: PluginConfig<Extends>;
} & Omit<Extends['userConfig'], 'source' | 'tools' | 'testing'>;

export type CliNormalizedConfig<
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
    source?: Record<string, any>;
    tools?: Record<string, any>;
    testing?: Record<string, any>;
    [property: string]: any;
    // eslint-disable-next-line @typescript-eslint/ban-types
  } = {},
> = {
  source: BaseSourceNormalizedConfig<
    DropUndefined<Extends['normalizedConfig']>['source']
  >;
  tools: BaseToolsNormalizedConfig<
    DropUndefined<Extends['normalizedConfig']>['tools']
  >;
  plugins: PluginConfig<Extends>;
  testing: BaseTestingNormalizedConfig<
    DropUndefined<Extends['normalizedConfig']>['testing']
  >;
} & Omit<
  Extends['normalizedConfig'],
  'plugins' | 'source' | 'tools' | 'testing'
>;

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
  config: CliUserConfig<Extends>;
  filePath: string | false;
  dependencies: string[];
  pkgConfig: CliUserConfig<Extends>;
  jsConfig: CliUserConfig<Extends>;
};

export type ConfigParams =
  | CliUserConfig
  | Promise<CliUserConfig>
  | ((env: any) => CliUserConfig | Promise<CliUserConfig>);
