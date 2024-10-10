import type { AliasOption } from '@modern-js/utils';
import type {
  ConfigChain,
  ConfigChainWithContext,
  DevConfig,
  DistPathConfig,
  HtmlConfig,
  HtmlTagDescriptor,
  OutputConfig,
  Polyfill,
  RequestHandler,
  RsbuildConfig,
  RsbuildPlugin,
  RsbuildPluginAPI,
  RsbuildPlugins,
  RsbuildTarget,
  Rspack,
  ScriptInject,
  SecurityConfig,
  ServerConfig,
  SourceConfig,
  ToolsConfig,
} from '@rsbuild/core';
import type { PluginAssetsRetryOptions } from '@rsbuild/plugin-assets-retry';
import type { PluginBabelOptions } from '@rsbuild/plugin-babel';
import type { PluginCheckSyntaxOptions } from '@rsbuild/plugin-check-syntax';
import type { PluginCssMinimizerOptions } from '@rsbuild/plugin-css-minimizer';
import type { PluginLessOptions } from '@rsbuild/plugin-less';
import type { PluginPugOptions } from '@rsbuild/plugin-pug';
import type { PluginRemOptions } from '@rsbuild/plugin-rem';
import type { PluginSassOptions } from '@rsbuild/plugin-sass';
import type { PluginSourceBuildOptions } from '@rsbuild/plugin-source-build';
import type { PluginStyledComponentsOptions } from '@rsbuild/plugin-styled-components';
import type { SvgDefaultExport } from '@rsbuild/plugin-svgr';
import type { PluginTypeCheckerOptions } from '@rsbuild/plugin-type-check';
import type { Options as AutoprefixerOptions } from 'autoprefixer';
import type { Options as HTMLPluginOptions } from 'html-webpack-plugin';
import type TerserPlugin from 'terser-webpack-plugin';
import type { PluginTsLoaderOptions } from './webpack/plugins/tsLoader';

type ArrayOrNot<T> = T | T[];

export type Stats = Omit<
  Rspack.Stats,
  '#private' | 'hash' | 'startTime' | 'endTime'
>;

export type RspackConfig = Rspack.Configuration;

export type MultiStats = Rspack.MultiStats;

/**
 * custom properties
 * e.g. { name: 'viewport' content: 'width=500, initial-scale=1' }
 * */
type MetaAttrs = { [attrName: string]: string | boolean };

export type MetaOptions = {
  /**
   * name content pair
   * e.g. { viewport: 'width=device-width, initial-scale=1, shrink-to-fit=no' }`
   * */
  [name: string]: string | false | MetaAttrs;
};

export type CreateBuilderCommonOptions = {
  frameworkConfigPath?: string;
  /** The root path of current project. */
  cwd: string;
};

export type BundlerType = 'rspack' | 'webpack';

export type CreateUniBuilderOptions = {
  bundlerType: BundlerType;
  config: UniBuilderConfig;
} & Partial<CreateBuilderCommonOptions>;

export type GlobalVars = Record<string, any>;

export type ChainedGlobalVars = ConfigChainWithContext<
  GlobalVars,
  {
    env: string;
    target: RsbuildTarget;
  }
>;

export type ModuleScopes = Array<string | RegExp>;

export type MainFields = (string | string[])[];

export type DevServerHttpsOptions = boolean | { key: string; cert: string };

export type DisableSourceMapOption =
  | boolean
  | {
      js?: boolean;
      css?: boolean;
    };

export type ToolsDevServerConfig = ConfigChain<{
  before?: RequestHandler[];
  after?: RequestHandler[];
  client?: DevConfig['client'];
  compress?: ServerConfig['compress'];
  devMiddleware?: {
    writeToDisk?: DevConfig['writeToDisk'];
  };
  liveReload?: boolean;
  headers?: ServerConfig['headers'];
  historyApiFallback?: ServerConfig['historyApiFallback'];
  hot?: boolean;
  https?: DevServerHttpsOptions;
  setupMiddlewares?: DevConfig['setupMiddlewares'];
  proxy?: ServerConfig['proxy'];
}>;

export type TerserPluginOptions = TerserPlugin.BasePluginOptions &
  TerserPlugin.DefinedDefaultMinimizerAndOptions<TerserPlugin.TerserOptions>;

export type ToolsTerserConfig = ConfigChain<TerserPluginOptions>;

export type ToolsAutoprefixerConfig = ConfigChain<AutoprefixerOptions>;

export type UniBuilderExtraConfig = {
  tools?: {
    /**
     * Modify the config of [autoprefixer](https://github.com/postcss/autoprefixer)
     */
    autoprefixer?: ToolsAutoprefixerConfig;
    // tools.htmlPlugin minify option should works
    htmlPlugin?:
      | boolean
      | ConfigChainWithContext<
          HTMLPluginOptions,
          {
            entryName: string;
            entryValue: (string | string[] | Rspack.EntryDescription)[];
          }
        >;
    styledComponents?: false | PluginStyledComponentsOptions;
    devServer?: ToolsDevServerConfig;
    /**
     * Configure the [Pug](https://pugjs.org/) template engine.
     */
    pug?: true | PluginPugOptions['pugOptions'];
    /**
     * Modify the options of [fork-ts-checker-webpack-plugin](https://github.com/TypeStrong/fork-ts-checker-webpack-plugin).
     */
    tsChecker?: PluginTypeCheckerOptions['forkTsCheckerOptions'];
    /**
     * Modify the options of [css-minimizer-webpack-plugin](https://github.com/webpack-contrib/css-minimizer-webpack-plugin).
     */
    minifyCss?: PluginCssMinimizerOptions['pluginOptions'];
    /**
     * Modify the options of [babel-loader](https://github.com/babel/babel-loader)
     * When `tools.babel`'s type is Function，the default babel config will be passed in as the first parameter, the config object can be modified directly, or a value can be returned as the final result.
     * When `tools.babel`'s type is `Object`, the config will be shallow merged with default config by `Object.assign`.
     * Note that `Object.assign` is a shallow copy and will completely overwrite the built-in `presets` or `plugins` array, please use it with caution.
     */
    babel?: PluginBabelOptions['babelLoaderOptions'];
    /**
     * Modify the options of [ts-loader](https://github.com/TypeStrong/ts-loader).
     * When `tools.tsLoader` is not undefined, Rsbuild will use ts-loader instead of babel-loader to compile TypeScript code.
     *
     * Tips: this configuration is not yet supported in rspack
     */
    tsLoader?: PluginTsLoaderOptions;
    /**
     * Modify the options of [terser-webpack-plugin](https://github.com/webpack-contrib/terser-webpack-plugin).
     * @requires webpack
     */
    terser?: ToolsTerserConfig;
    /**
     * Modify the config of [less-loader](https://github.com/webpack-contrib/less-loader).
     */
    less?: PluginLessOptions['lessLoaderOptions'];
    /**
     * Modify the config of [sass-loader](https://github.com/webpack-contrib/sass-loader).
     */
    sass?: PluginSassOptions['sassLoaderOptions'];
  };
  dev?: {
    /** Set the page URL to open when the server starts. */
    startUrl?: boolean | string | string[];
    /** Execute a callback function before opening the `startUrl`. */
    beforeStartUrl?: () => Promise<void> | void;
    /**
     * Used to set the host of Dev Server.
     */
    host?: string;
    /**
     * After configuring this option, you can enable HTTPS Dev Server, and disabling the HTTP Dev Server.
     */
    https?: DevServerHttpsOptions;
    /**
     * Specify a port number for Dev Server to listen.
     */
    port?: number;
  };
  source?: {
    transformImport?: SourceConfig['transformImport'] | false;
    // TODO: need to support rsbuild alias type in server/utils
    alias?: AliasOption;
    /**
     * Define global variables. It can replace expressions like `process.env.FOO` in your code after compile.
     */
    globalVars?: ChainedGlobalVars;
    /**
     * Restrict importing paths. After configuring this option, all source files can only import code from
     * the specific paths, and import code from other paths is not allowed.
     */
    moduleScopes?: ConfigChain<ModuleScopes>;
    /**
     * This configuration will determine which field of `package.json` you use to import the `npm` module.
     * Same as the [resolve.mainFields](https://webpack.js.org/configuration/resolve/#resolvemainfields) config of webpack.
     */
    resolveMainFields?: MainFields | Partial<Record<RsbuildTarget, MainFields>>;
    /**
     * Add a prefix to [resolve.extensions](https://webpack.js.org/configuration/resolve/#resolveextensions).
     */
    resolveExtensionPrefix?: string | Partial<Record<RsbuildTarget, string>>;
  };
  output?: {
    /**
     * @deprecated use `output.minify` instead
     */
    disableMinimize?: boolean;
    /**
     * @deprecated use `output.filenameHash` instead
     */
    disableFilenameHash?: boolean;
    /**
     * Whether to generate a TypeScript declaration file for CSS Modules.
     */
    enableCssModuleTSDeclaration?: boolean;
    /**
     * @deprecated use `source.decorators` instead
     */
    enableLatestDecorators?: boolean;
    /**
     * @deprecated use `output.cssModules.localIdentName` instead
     */
    cssModuleLocalIdentName?: string;
    /**
     * Whether to generate a manifest file that contains information of all assets.
     */
    enableAssetManifest?: boolean;
    /**
     * Configure the retry of assets.
     */
    assetsRetry?: PluginAssetsRetryOptions;
    /**
     * Controls whether to the inline the runtime chunk to HTML.
     */
    disableInlineRuntimeChunk?: boolean;
    /**
     * Convert px to rem in CSS.
     */
    convertToRem?: boolean | PluginRemOptions;
    /**
     * Whether to treat all .css files in the source directory as CSS Modules.
     */
    disableCssModuleExtension?: boolean;
    /**
     * If this option is enabled, all unrecognized files will be emitted to the dist directory.
     * Otherwise, an exception will be thrown.
     */
    enableAssetFallback?: boolean;
    /**
     * Whether to disable TypeScript Type Checker.
     */
    disableTsChecker?: boolean;
    /**
     * @deprecated use `output.inlineScripts` instead
     */
    enableInlineScripts?: OutputConfig['inlineScripts'];
    /**
     * @deprecated use `output.inlineStyles` instead
     */
    enableInlineStyles?: OutputConfig['injectStyles'];
    /**
     * Configure the default export type of SVG files.
     */
    svgDefaultExport?: SvgDefaultExport;
    /**
     * Whether to transform SVGs into React components. If true, will treat all .svg files as assets.
     */
    disableSvgr?: boolean;
    /**
     * Whether to disable source map.
     */
    disableSourceMap?: DisableSourceMapOption;
    /**
     * @deprecated use `output.injectStyles` instead
     */
    disableCssExtract?: boolean;
  };
  html?: {
    appIcon?: string | HtmlConfig['appIcon'];
    /**
     * Remove the folder of the HTML files.
     * When this option is enabled, the generated HTML file path will change from `[name]/index.html` to `[name].html`.
     */
    disableHtmlFolder?: boolean;
    /**
     *  @deprecated use `html.tags` instead
     */
    tagsByEntries?: Record<string, ArrayOrNot<HtmlTagDescriptor>>;
    /**
     * @deprecated use `html.meta` instead
     */
    metaByEntries?: Record<string, MetaOptions>;
    /**
     * @deprecated use `html.title` instead
     */
    titleByEntries?: Record<string, string>;
    // TODO: need support rsbuild favicon type in server/utils
    favicon?: string;
    /**
     * @deprecated use `html.favicon` instead
     */
    faviconByEntries?: Record<string, string | undefined>;
    /**
     * @deprecated use `html.inject` instead
     */
    injectByEntries?: Record<string, ScriptInject>;
    /**
     * @deprecated use `html.template` instead
     */
    templateByEntries?: Partial<Record<string, string>>;
    /**
     * @deprecated use `html.templateParameters` instead
     */
    templateParametersByEntries?: Record<string, Record<string, unknown>>;
  };
  performance?: {
    /**
     * Specifies whether to modularize the import of [lodash](https://npmjs.com/package/lodash)
     * and remove unused lodash modules to reduce the code size of lodash.
     *
     * Tips: this configuration is not yet supported in rspack
     */
    transformLodash?: boolean;
  };
  security?: {
    /**
     * Adding an integrity attribute (`integrity`) to sub-resources introduced by HTML allows the browser to
     * verify the integrity of the introduced resource, thus preventing tampering with the downloaded resource.
     *
     * Tips: this configuration is not yet supported in rspack
     */
    sri?: SriOptions | boolean;
    /**
     * Analyze the build artifacts to identify advanced syntax that is incompatible with the current browser scope.
     */
    checkSyntax?: boolean | PluginCheckSyntaxOptions;
  };
  experiments?: {
    lazyCompilation?: DevConfig['lazyCompilation'];
    /**
     * Enable the ability for source code building
     */
    sourceBuild?:
      | boolean
      | Pick<PluginSourceBuildOptions, 'sourceField' | 'resolvePriority'>;
  };
};

export type SriOptions = {
  hashFuncNames?: [string, ...string[]];
  enabled?: 'auto' | true | false;
  hashLoading?: 'eager' | 'lazy';
};

export type OverridesUniBuilderInstance = {
  addPlugins: (
    plugins: Array<UniBuilderPlugin | LooseRsbuildPlugin>,
    options?: {
      before?: string;
      environment?: string;
    },
  ) => void;
};

export type UniBuilderContext = RsbuildPluginAPI['context'] & {
  target: RsbuildTarget[];
  framework: string;
  srcPath: string;
  entry: Record<string, string | string[]>;
};

/**
 * make the plugins type looser to avoid type mismatch
 */
export type UniBuilderPluginAPI = {
  [key in keyof RsbuildPluginAPI]: any;
} & {
  /** The following APIs only type incompatibility */
  onBeforeCreateCompiler: (fn: any) => void;
  onAfterCreateCompiler: (fn: any) => void;
  onBeforeBuild: (fn: any) => void;
  modifyBundlerChain: (fn: any) => void;
  getNormalizedConfig: () => any;

  /** The following APIs need to be compatible */
  context: UniBuilderContext;
  getBuilderConfig: () => Readonly<any>;
  modifyBuilderConfig: (
    fn: (
      config: any,
      utils: {
        mergeBuilderConfig: <T>(...configs: T[]) => T;
      },
    ) => any | Promise<any>,
  ) => void;
};

/**
 * compat legacy modern.js builder plugin
 */
export type UniBuilderPlugin = {
  name: string;
  setup: (api: UniBuilderPluginAPI) => void | Promise<void>;
  pre?: string[];
  post?: string[];
  remove?: string[];
};

// Support for registering any version Rsbuild plugins
export type LooseRsbuildPlugin = Omit<RsbuildPlugin, 'setup'> & {
  setup: (api: any) => Promise<void> | void;
};

export type DistPath = DistPathConfig & {
  server?: string;
  worker?: string;
};

export type UniBuilderConfig = {
  dev?: RsbuildConfig['dev'];
  html?: Omit<HtmlConfig, 'appIcon'>;
  output?: Omit<OutputConfig, 'polyfill' | 'distPath'> & {
    polyfill?: Polyfill | 'ua';
    distPath?: DistPath;
  };
  performance?: RsbuildConfig['performance'];
  security?: Omit<SecurityConfig, 'sri'>;
  tools?: Omit<ToolsConfig, 'htmlPlugin'>;
  source?: Omit<SourceConfig, 'alias' | 'transformImport'>;
  // plugins is a new field, should avoid adding modern plugin by mistake
  plugins?: RsbuildPlugins;
  environments?: RsbuildConfig['environments'];
} & UniBuilderExtraConfig;
