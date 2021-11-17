import { loadConfig } from '@modern-js/load-config';
import Ajv, { ErrorObject } from 'ajv';
import ajvKeywords from 'ajv-keywords';
import logger from 'signale';
import {
  createDebugger,
  getPort,
  isDev,
  MetaOptions,
  PLUGIN_SCHEMAS,
  chalk,
} from '@modern-js/utils';
import mergeWith from 'lodash.mergewith';
import betterAjvErrors from 'better-ajv-errors';
import { codeFrameColumns } from '@babel/code-frame';
import { PluginConfig } from '../loadPlugins';
import { repeatKeyWarning } from '../utils/repeatKeyWarning';
import { defaults } from './defaults';
import { mergeConfig, NormalizedConfig } from './mergeConfig';
import { patchSchema, PluginValidateSchema } from './schema';

const debug = createDebugger('resolve-config');

export { defaults as defaultsConfig };
export { mergeConfig };

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
    | ((scopes: Array<string | RegExp>) => Array<string | RegExp>);
  include?: Array<string | RegExp>;
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
  copy?: Record<string, unknown>;
  scriptExt?: Record<string, unknown>;
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
}

export interface ServerConfig {
  routes?: Record<
    string,
    | string
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
  logger?: Record<string, string>;
  measure?: Record<string, string>;
  enableMicroFrontendDebug?: boolean;
}

export interface DevConfig {
  assetPrefix?: string | boolean;
  https?: boolean;
}

export interface DeployConfig {
  microFrontend?: boolean | Record<string, unknown>;
  domain?: string | Array<string>;
  domainByEntries?: Record<string, string | Array<string>>;
}

type ConfigFunction =
  | Record<string, unknown>
  // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
  | ((config: Record<string, unknown>) => Record<string, unknown> | void);
export interface ToolsConfig {
  webpack?: ConfigFunction;
  babel?: ConfigFunction;
  autoprefixer?: ConfigFunction;
  postcss?: ConfigFunction;
  lodash?: ConfigFunction;
  devServer?: Record<string, unknown>;
  tsLoader?: ConfigFunction;
  terser?: ConfigFunction;
  minifyCss?: ConfigFunction;
  esbuild?: Record<string, unknown>;
}

export type RuntimeConfig = Record<string, any>;

export interface RuntimeByEntriesConfig {
  [name: string]: RuntimeConfig;
}

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

export const defineConfig = (config: ConfigParam): ConfigParam => config;

export const loadUserConfig = async (
  appDirectory: string,
  filePath?: string,
): Promise<LoadedConfig> => {
  const loaded = await loadConfig<ConfigParam>(appDirectory, filePath);

  const config = !loaded
    ? {}
    : await (typeof loaded.config === 'function'
        ? loaded.config(0)
        : loaded.config);

  return {
    config: mergeWith({}, config || {}, loaded?.pkgConfig || {}),
    jsConfig: config || {},
    pkgConfig: (loaded?.pkgConfig || {}) as UserConfig,
    filePath: loaded?.path,
    dependencies: loaded?.dependencies || [],
  };
};

const showAdditionalPropertiesError = (error: ErrorObject) => {
  if (
    error.keyword === 'additionalProperties' &&
    error.instancePath &&
    error.params.additionalProperty
  ) {
    const target = `${error.instancePath.substr(1)}.${
      error.params.additionalProperty
    }`;

    const name = Object.keys(PLUGIN_SCHEMAS).find(key =>
      (PLUGIN_SCHEMAS as Record<string, any>)[key].some(
        (schemaItem: any) => schemaItem.target === target,
      ),
    );

    if (name) {
      logger.warn(
        `The configuration of ${chalk.bold(
          target,
        )} is provided by plugin ${chalk.bold(name)}. Please use ${chalk.bold(
          'yarn new',
        )} to enable the corresponding capability.\n`,
      );
    }
  }
};

/* eslint-disable max-statements, max-params */
export const resolveConfig = async (
  loaded: LoadedConfig,
  configs: UserConfig[],
  schemas: PluginValidateSchema[],
  isRestart: boolean,
  argv: string[],
): Promise<NormalizedConfig> => {
  const { config: userConfig, jsConfig, pkgConfig } = loaded;

  const ajv = new Ajv({ $data: true, strict: false });

  ajvKeywords(ajv);

  const validateSchema = patchSchema(schemas);

  const validate = ajv.compile(validateSchema);

  repeatKeyWarning(validateSchema, jsConfig, pkgConfig);

  // validate user config.
  const valid = validate(userConfig);

  if (!valid && validate.errors?.length) {
    showAdditionalPropertiesError(validate?.errors[0]);
    const errors = betterAjvErrors(
      validateSchema,
      userConfig,
      validate.errors?.map(e => ({
        ...e,
        dataPath: e.instancePath,
      })),
      {
        format: 'js',
        indent: 2,
      },
    );

    logger.log(
      codeFrameColumns(
        JSON.stringify(userConfig, null, 2),
        {
          start: errors?.[0].start as any,
          end: errors?.[0].end as any,
        },
        {
          highlightCode: true,
          message: errors?.[0].error,
        },
      ),
    );
    throw new Error(`Validate configuration error`);
  }

  // validate config from plugins.
  for (const config of configs) {
    if (!validate(config)) {
      logger.error(validate.errors);
      throw new Error(`Validate configuration error.`);
    }
  }
  const resolved = mergeConfig([defaults, ...configs, userConfig]);

  resolved._raw = loaded.config;

  if (isDev() && argv[0] === 'dev' && !isRestart) {
    resolved.server.port = await getPort(resolved.server.port!);
  }

  debug('resolved %o', resolved);

  return resolved;
};
/* eslint-enable max-statements, max-params */
