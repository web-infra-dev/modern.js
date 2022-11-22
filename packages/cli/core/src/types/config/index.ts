import { PluginConfig } from '../plugin';
import type {
  BaseTestingNormalizedConfig,
  BaseTestingUserConfig,
} from './testing';

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
  testing?: BaseTestingUserConfig<
    DropUndefined<Extends['userConfig']>['testing']
  >;
  plugins?: PluginConfig<Extends>;
} & Omit<Extends['userConfig'], 'plugins' | 'testing'>;

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
  plugins: PluginConfig<Extends>;
  testing: BaseTestingNormalizedConfig<
    DropUndefined<Extends['normalizedConfig']>['testing']
  >;
} & Omit<Extends['normalizedConfig'], 'plugins' | 'testing'>;

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
