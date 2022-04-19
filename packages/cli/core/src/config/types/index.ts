import type { IncomingMessage, ServerResponse } from 'http';
import type { NextFunction, BffProxyOptions } from '@modern-js/types';
import type { MetaOptions } from '@modern-js/utils';
import type { TransformOptions } from '@babel/core';
import type webpack from 'webpack';
import type { Configuration as WebpackConfiguration } from 'webpack';
import type WebpackChain from 'webpack-chain';
import autoprefixer from 'autoprefixer';
import type {
  BasePluginOptions,
  TerserOptions as RawTerserOptions,
} from 'terser-webpack-plugin';
import type { PluginConfig } from '../../loadPlugins';
import type { TestConfig, JestConfig } from './test';
import type { SassConfig, SassLoaderOptions } from './sass';
import type { LessConfig, LessLoaderOptions } from './less';
import type { UnbundleConfig } from './unbundle';
import type {
  SSGConfig,
  SSGRouteOptions,
  SSGMultiEntryOptions,
  SSGSingleEntryOptions,
} from './ssg';

type AutoprefixerOptions = autoprefixer.Options;
type TerserOptions = BasePluginOptions & RawTerserOptions;

export type {
  TestConfig,
  JestConfig,
  UnbundleConfig,
  SassConfig,
  SassLoaderOptions,
  LessConfig,
  LessLoaderOptions,
  SSGConfig,
  SSGRouteOptions,
  SSGMultiEntryOptions,
  SSGSingleEntryOptions,
  TransformOptions,
  AutoprefixerOptions,
  TerserOptions,
};

export interface SourceConfig {
  entries?: Record<
    string,
    | string
    | {
        entry: string;
        enableFileSystemRoutes?: boolean;
        disableMount?: boolean;
      }
  >;
  disableDefaultEntries?: boolean;
  entriesDir?: string;
  configDir?: string;
  apiDir?: string;
  envVars?: Array<string>;
  globalVars?: Record<string, string>;
  alias?:
    | Record<string, string>
    | ((aliases: Record<string, string>) => Record<string, unknown>);
  moduleScopes?:
    | Array<string | RegExp>
    | ((scopes: Array<string | RegExp>) => void)
    | ((scopes: Array<string | RegExp>) => Array<string | RegExp>);
  include?: Array<string | RegExp>;

  /**
   * The configuration of `source.designSystem` is provided by plugin `@modern-js/plugin-tailwindcss`.
   * Please use `yarn new` to enable the corresponding capability.
   * @requires `@modern-js/plugin-tailwindcss`
   */
  designSystem?: Record<string, any>;
}

export interface OutputConfig {
  assetPrefix?: string;
  htmlPath?: string;
  jsPath?: string;
  cssPath?: string;
  mediaPath?: string;
  path?: string;
  title?: string;
  titleByEntries?: Record<string, string>;
  meta?: MetaOptions;
  metaByEntries?: Record<string, MetaOptions>;
  inject?: 'body' | 'head' | boolean;
  injectByEntries?: Record<string, 'body' | 'head' | boolean>;
  mountId?: string;
  favicon?: string;
  faviconByEntries?: Record<string, string | undefined>;
  copy?: Array<Record<string, unknown> & { from: string }>;
  scriptExt?: Record<string, unknown>;
  disableTsChecker?: boolean;
  disableHtmlFolder?: boolean;
  disableCssModuleExtension?: boolean;
  disableCssExtract?: boolean;
  enableCssModuleTSDeclaration?: boolean;
  disableMinimize?: boolean;
  enableInlineStyles?: boolean;
  enableInlineScripts?: boolean;
  disableSourceMap?: boolean;
  disableInlineRuntimeChunk?: boolean;
  disableAssetsCache?: boolean;
  enableLatestDecorators?: boolean;
  polyfill?: 'off' | 'usage' | 'entry' | 'ua';
  dataUriLimit?: number;
  templateParameters?: Record<string, unknown>;
  templateParametersByEntries?: Record<
    string,
    Record<string, unknown> | undefined
  >;
  cssModuleLocalIdentName?: string;
  enableModernMode?: boolean;
  federation?: boolean;
  disableNodePolyfill?: boolean;
  enableTsLoader?: boolean;

  /**
   * Disables lazy import support for styles, currently supports antd and arco-design.
   * The configuration of `output.disableAutoImportStyle` is provided by plugin `@modern-js/plugin-unbundle`.
   * Please use `yarn new` to enable the corresponding capability.
   * @requires `@modern-js/plugin-unbundle`
   */
  disableAutoImportStyle?: boolean;

  /**
   * The configuration of `output.ssg` is provided by plugin `@modern-js/plugin-ssg`.
   * Please use `yarn new` to enable the corresponding capability.
   * @requires `@modern-js/plugin-ssg`
   */
  ssg?: SSGConfig;
}

export interface ServerConfig {
  routes?: Record<
    string,
    | string
    | string[]
    | {
        route: string | string[];
        disableSpa?: boolean;
      }
  >;
  publicRoutes?: { [filepath: string]: string };
  ssr?: boolean | Record<string, unknown>;
  ssrByEntries?: Record<string, boolean | Record<string, unknown>>;
  baseUrl?: string | Array<string>;
  port?: number;
  logger?: boolean | Record<string, any>;
  metrics?: boolean | Record<string, any>;
  enableMicroFrontendDebug?: boolean;
}

export type DevProxyOptions = string | Record<string, string>;

export interface DevConfig {
  assetPrefix?: string | boolean;
  https?: boolean;

  /**
   * The configuration of `dev.proxy` is provided by plugin `@modern-js/plugin-proxy`.
   * Please use `yarn new` to enable the corresponding capability.
   * @requires `@modern-js/plugin-proxy`
   */
  proxy?: DevProxyOptions;

  /**
   * The configuration of `dev.unbundle` is provided by plugin `@modern-js/plugin-unbundle`.
   * Please use `yarn new` to enable the corresponding capability.
   * @requires `@modern-js/plugin-unbundle`
   */
  unbundle?: UnbundleConfig;
}

export interface MicroFrontend {
  enableHtmlEntry?: boolean;
  externalBasicLibrary?: boolean;
  moduleApp?: string;
}

export interface DeployConfig {
  microFrontend?: false | MicroFrontend;
  domain?: string | Array<string>;
  domainByEntries?: Record<string, string | Array<string>>;
}

type ConfigFunction =
  | Record<string, unknown>
  | ((
      config: Record<string, unknown>,
      // FIXME: utils type
      utils?: any,
    ) => Record<string, unknown> | void);

export type RequestHandler = (
  req: IncomingMessage,
  res: ServerResponse,
  next: NextFunction,
) => void;

export type DevServerConfig = {
  proxy?: BffProxyOptions;
  headers?: Record<string, string>;
  before?: RequestHandler[];
  after?: RequestHandler[];
  [propsName: string]: any;
};

export type WebpackConfig =
  | WebpackConfiguration
  | ((
      config: WebpackConfiguration,
      // FIXME: utils type
      utils: {
        env: string;
        chain: WebpackChain;
        webpack: typeof webpack;
        [key: string]: any;
      },
    ) => WebpackConfiguration | void);

export type BabelConfig =
  | TransformOptions
  // FIXME: utils type
  | ((config: TransformOptions, utils?: any) => TransformOptions | void);

export type AutoprefixerConfig =
  | AutoprefixerOptions
  | ((config: AutoprefixerOptions) => AutoprefixerOptions | void);

export type TerserConfig =
  | TerserOptions
  | ((config: TerserOptions) => TerserOptions | void);

export interface ToolsConfig {
  webpack?: WebpackConfig;
  babel?: BabelConfig;
  autoprefixer?: AutoprefixerConfig;
  postcss?: ConfigFunction;
  styledComponents?: ConfigFunction;
  lodash?: ConfigFunction;
  devServer?: DevServerConfig;
  tsLoader?: ConfigFunction;
  terser?: TerserConfig;
  minifyCss?: ConfigFunction;
  esbuild?: Record<string, unknown>;

  /**
   * The configuration of `tools.tailwindcss` is provided by plugin `@modern-js/plugin-tailwindcss`.
   * Please use `yarn new` to enable the corresponding capability.
   * @requires `@modern-js/plugin-tailwindcss`
   */
  tailwindcss?:
    | Record<string, any>
    | ((options: Record<string, any>) => Record<string, any> | void);

  /**
   * The configuration of `tools.jest` is provided by plugin `@modern-js/plugin-testing`.
   * Please use `yarn new` to enable the corresponding capability.
   * @requires `@modern-js/plugin-testing`
   */
  jest?: TestConfig['jest'];

  /**
   * The configuration of `tools.sass` is provided by plugin `@modern-js/plugin-sass`.
   * Please use `yarn new` to enable the corresponding capability.
   * @requires `@modern-js/plugin-sass`
   */
  sass?: SassConfig;

  /**
   * The configuration of `tools.less` is provided by plugin `@modern-js/plugin-less`.
   * Please use `yarn new` to enable the corresponding capability.
   * @requires `@modern-js/plugin-less`
   */
  less?: LessConfig;
}

export type RuntimeConfig = Record<string, any>;

export interface RuntimeByEntriesConfig {
  [name: string]: RuntimeConfig;
}

export type BffConfig = Partial<{
  prefix: string;
  requestCreator: string;
  fetcher: string;
  proxy: Record<string, any>;
}>;

export interface UserConfig {
  source?: SourceConfig;
  output?: OutputConfig;
  server?: ServerConfig;
  dev?: DevConfig;
  deploy?: DeployConfig;
  tools?: ToolsConfig;
  plugins?: PluginConfig;
  runtime?: RuntimeConfig;
  runtimeByEntries?: RuntimeByEntriesConfig;

  /**
   * The configuration of `bff` is provided by plugin `@modern-js/plugin-bff`.
   * Please use `yarn new` to enable the corresponding capability.
   * @requires `@modern-js/plugin-bff`
   */
  bff?: BffConfig;

  /**
   * The configuration of `testing` is provided by plugin `@modern-js/plugin-testing`.
   * Please use `yarn new` to enable the corresponding capability.
   * @requires `@modern-js/plugin-testing`
   */
  testing?: TestConfig;
}

export type ConfigParam =
  | UserConfig
  | Promise<UserConfig>
  | ((env: any) => UserConfig | Promise<UserConfig>);

export interface LoadedConfig {
  config: UserConfig;
  filePath: string | false;
  dependencies: string[];
  pkgConfig: UserConfig;
  jsConfig: UserConfig;
}
