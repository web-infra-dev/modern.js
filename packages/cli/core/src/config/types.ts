import type { IncomingMessage, ServerResponse } from 'http';
import type { NextFunction, BffProxyOptions } from '@modern-js/types';
import type { MetaOptions } from '@modern-js/utils';
import type { Config as JestConfigTypes } from '@jest/types';
import type { PluginConfig } from '../loadPlugins';

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
   * @requires plugin-tailwindcss
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
   * disables lazy import support for styles
   * currently supports antd and arco-design
   * @requires plugin-unbundle
   */
  disableAutoImportStyle?: boolean;
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
   * @requires plugin-proxy
   */
  proxy?: DevProxyOptions;

  /**
   * @requires plugin-unbundle
   */
  unbundle?: {
    /**
     * Some package A may require another package B that is intended for Node.js
     * use only. In such a case, if package B cannot be converted to ESM, it will
     * cause package A to fail during unbundle development, even though package B
     * is not really required. Package B can thus be safely ignored via this option
     * to ensure transpilation of package A to ESM
     */
    ignore?: string | string[];

    /**
     * ignores cached esm modules and recompiles dependencies not available
     * from PDN host on dev start.
     * default: false
     */
    ignoreModuleCache?: boolean;

    /**
     * clears cache of downloaded esm modules (from PDN) on dev start.
     * default: false
     */
    clearPdnCache?: boolean;

    /**
     * modifies host to attempt to download esm modules from
     */
    pdnHost?: string;
  };
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
  | ((config: Record<string, unknown>) => Record<string, unknown> | void);

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

export type JestConfig = JestConfigTypes.InitialOptions;

export interface TestConfig {
  /**
   * Decide which transformer will be used to compile file
   * Default: babel-jest
   */
  transformer?: 'babel-jest' | 'ts-jest';

  /**
   * Original jest config
   * Doc: https://jestjs.io/docs/configuration
   */
  jest?: JestConfig | ((jestConfig: JestConfig) => JestConfig);
}

export interface ToolsConfig {
  webpack?: ConfigFunction;
  babel?: ConfigFunction;
  autoprefixer?: ConfigFunction;
  postcss?: ConfigFunction;
  styledComponents?: ConfigFunction;
  lodash?: ConfigFunction;
  devServer?: DevServerConfig;
  tsLoader?: ConfigFunction;
  terser?: ConfigFunction;
  minifyCss?: ConfigFunction;
  esbuild?: Record<string, unknown>;

  /**
   * @requires plugin-tailwindcss
   */
  tailwindcss?:
    | Record<string, any>
    | ((options: Record<string, any>) => Record<string, any> | void);

  /**
   * @requires plugin-testing
   */
  jest?: TestConfig['jest'];
}

export type RuntimeConfig = Record<string, any>;

export interface RuntimeByEntriesConfig {
  [name: string]: RuntimeConfig;
}

export type BffConfig = {
  prefix?: string;
  requestCreator?: string;
  fetcher?: string;
  proxy: Record<string, any>;
};

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
   * @requires plugin-bff
   */
  bff?: BffConfig;

  /**
   * @requires plugin-testing
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
