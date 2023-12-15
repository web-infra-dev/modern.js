import type {
  NodeEnv,
  MetaOptions,
  ServerConfig,
  ScriptInject,
  RsbuildTarget,
  ChainedConfig,
  ChainedConfigWithUtils,
  InlineChunkTest,
  DevConfig,
  RequestHandler,
} from '@rsbuild/shared';
import type { RsbuildConfig } from '@rsbuild/core';
import type { PluginAssetsRetryOptions } from '@rsbuild/plugin-assets-retry';
import type { PluginStyledComponentsOptions } from '@rsbuild/plugin-styled-components';
import type { LazyCompilationOptions } from './webpack/plugins/lazyCompilation';
import type { PluginRemOptions } from '@rsbuild/plugin-rem';
import type { PluginTsLoaderOptions } from './webpack/plugins/tsLoader';
import type { SvgDefaultExport } from '@rsbuild/plugin-svgr';
import type { PluginCssMinimizerOptions } from '@rsbuild/plugin-css-minimizer';
import type { PluginTypeCheckerOptions } from '@rsbuild/plugin-type-check';
import type { PluginCheckSyntaxOptions } from '@rsbuild/plugin-check-syntax';
import type { PluginPugOptions } from '@rsbuild/plugin-pug';
import type { PluginBabelOptions } from '@rsbuild/plugin-babel';

export type CreateWebpackBuilderOptions = {
  bundlerType: 'webpack';
  config: UniBuilderWebpackConfig;
  frameworkConfigPath?: string;
  /** The root path of current project. */
  cwd: string;
};

export type CreateRspackBuilderOptions = {
  bundlerType: 'rspack';
  config: UniBuilderRspackConfig;
  frameworkConfigPath?: string;
  /** The root path of current project. */
  cwd?: string;
};

export type CreateUniBuilderOptions =
  | CreateWebpackBuilderOptions
  | CreateRspackBuilderOptions;

export type GlobalVars = Record<string, any>;

export type ChainedGlobalVars = ChainedConfigWithUtils<
  GlobalVars,
  {
    env: NodeEnv;
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

export type UniBuilderExtraConfig = {
  tools?: {
    styledComponents?: PluginStyledComponentsOptions;
    devServer?: {
      before?: RequestHandler[];
      after?: RequestHandler[];
      client?: DevConfig['client'];
      compress?: ServerConfig['compress'];
      devMiddleware?: {
        writeToDisk: DevConfig['writeToDisk'];
      };
      headers?: ServerConfig['headers'];
      historyApiFallback?: ServerConfig['historyApiFallback'];
      hot?: boolean;
      https?: DevServerHttpsOptions;
      setupMiddlewares?: DevConfig['setupMiddlewares'];
      proxy?: ServerConfig['proxy'];
    };
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
  };
  dev?: {
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
    /**
     * Define global variables. It can replace expressions like `process.env.FOO` in your code after compile.
     */
    globalVars?: ChainedGlobalVars;
    /**
     * Restrict importing paths. After configuring this option, all source files can only import code from
     * the specific paths, and import code from other paths is not allowed.
     */
    moduleScopes?: ChainedConfig<ModuleScopes>;
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
    enableInlineScripts?: boolean | InlineChunkTest;
    /**
     * @deprecated use `output.inlineStyles` instead
     */
    enableInlineStyles?: boolean | InlineChunkTest;
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
    /**
     * Remove the folder of the HTML files.
     * When this option is enabled, the generated HTML file path will change from `[name]/index.html` to `[name].html`.
     */
    disableHtmlFolder?: boolean;
    /**
     * @deprecated use `html.meta` instead
     */
    metaByEntries?: Record<string, MetaOptions>;
    /**
     * @deprecated use `html.title` instead
     */
    titleByEntries?: Record<string, string>;
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
  security?: {
    /**
     * Analyze the build artifacts to identify advanced syntax that is incompatible with the current browser scope.
     */
    checkSyntax?: boolean | PluginCheckSyntaxOptions;
  };
  experiments?: {
    /**
     * Enable the ability for source code building
     */
    sourceBuild?: boolean;
  };
};

export type SriOptions = {
  hashFuncNames?: [string, ...string[]];
  enabled?: 'auto' | true | false;
  hashLoading?: 'eager' | 'lazy';
};

export type UniBuilderWebpackConfig = RsbuildConfig &
  UniBuilderExtraConfig & {
    security?: {
      /**
       * Adding an integrity attribute (`integrity`) to sub-resources introduced by HTML allows the browser to
       * verify the integrity of the introduced resource, thus preventing tampering with the downloaded resource.
       */
      sri?: SriOptions | boolean;
    };
    experiments?: {
      lazyCompilation?: LazyCompilationOptions;
    };
    tools?: {
      /**
       * Modify the options of [ts-loader](https://github.com/TypeStrong/ts-loader).
       * When `tools.tsLoader` is not undefined, Rsbuild will use ts-loader instead of babel-loader to compile TypeScript code.
       */
      tsLoader?: PluginTsLoaderOptions;
    };
  };

export type UniBuilderRspackConfig = RsbuildConfig & UniBuilderExtraConfig;

export type BuilderConfig<B = 'rspack'> = B extends 'rspack'
  ? UniBuilderRspackConfig
  : UniBuilderWebpackConfig;
