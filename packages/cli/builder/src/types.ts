import type { AliasOption } from '@modern-js/utils';
import type {
  ConfigChain,
  ConfigChainWithContext,
  DevConfig,
  DistPathConfig,
  EnvironmentConfig,
  HtmlConfig,
  OutputConfig,
  Polyfill,
  RsbuildConfig,
  RsbuildPluginAPI,
  RsbuildPlugins,
  RsbuildTarget,
  Rspack,
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
import type { PluginRemOptions } from '@rsbuild/plugin-rem';
import type { PluginSassOptions } from '@rsbuild/plugin-sass';
import type { PluginSourceBuildOptions } from '@rsbuild/plugin-source-build';
import type { SvgDefaultExport } from '@rsbuild/plugin-svgr';
import type { PluginTypeCheckerOptions } from '@rsbuild/plugin-type-check';
import type { Options as AutoprefixerOptions } from 'autoprefixer';

export type CacheGroup = Rspack.OptimizationSplitChunksCacheGroup;

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
  rscClientRuntimePath?: string;
  rscServerRuntimePath?: string;
  internalDirectory?: string;
};

export type BundlerType = 'rspack';

export type CreateBuilderOptions = {
  rscClientRuntimePath?: string;
  rscServerRuntimePath?: string;
  bundlerType: BundlerType;
  config: BuilderConfig;
} & Partial<CreateBuilderCommonOptions>;

export type GlobalVars = Record<string, any>;

export type ChainedGlobalVars = ConfigChainWithContext<
  GlobalVars,
  {
    env: string;
    target: RsbuildTarget;
  }
>;

export type MainFields = (string | string[])[];

export type DevServerHttpsOptions = boolean | { key: string; cert: string };

export type ToolsDevServerConfig = ConfigChain<{
  compress?: ServerConfig['compress'];
  headers?: ServerConfig['headers'];
  historyApiFallback?: ServerConfig['historyApiFallback'];
  proxy?: ServerConfig['proxy'];
}>;

export type ToolsAutoprefixerConfig = ConfigChain<AutoprefixerOptions>;

export type BuilderExtraConfig = {
  tools?: {
    /**
     * Modify the config of [autoprefixer](https://github.com/postcss/autoprefixer)
     */
    autoprefixer?: ToolsAutoprefixerConfig;
    // tools.htmlPlugin minify option should works
    htmlPlugin?: ToolsConfig['htmlPlugin'];
    devServer?: ToolsDevServerConfig;
    /**
     * Modify the options of [fork-ts-checker-webpack-plugin](https://github.com/TypeStrong/fork-ts-checker-webpack-plugin).
     */
    tsChecker?: PluginTypeCheckerOptions['tsCheckerOptions'];
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
  };
  source?: {
    transformImport?: SourceConfig['transformImport'] | false;
    // TODO: need to support rsbuild alias type in server/utils
    alias?: AliasOption;
    /**
     * Define global variables. It can replace expressions like `process.env.FOO` in your code after compile.
     */
    globalVars?: ChainedGlobalVars;
  };
  output?: {
    /**
     * Whether to generate a TypeScript declaration file for CSS Modules.
     */
    enableCssModuleTSDeclaration?: boolean;
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
     * Whether to disable TypeScript Type Checker.
     */
    disableTsChecker?: boolean;
    /**
     * Configure the default export type of SVG files.
     */
    svgDefaultExport?: SvgDefaultExport;
    /**
     * Whether to transform SVGs into React components. If true, will treat all .svg files as assets.
     */
    disableSvgr?: boolean;
  };
  html?: {
    appIcon?: HtmlConfig['appIcon'];
    // TODO: need support rsbuild favicon type in server/utils
    favicon?: string;
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

export type BuilderContext = RsbuildPluginAPI['context'] & {
  target: RsbuildTarget[];
  framework: string;
  srcPath: string;
  entry: Record<string, string | string[]>;
};

/**
 * make the plugins type looser to avoid type mismatch
 */
export type BuilderPluginAPI = {
  [key in keyof RsbuildPluginAPI]: any;
} & {
  /** The following APIs only type incompatibility */
  onBeforeCreateCompiler: (fn: any) => void;
  onAfterCreateCompiler: (fn: any) => void;
  onBeforeBuild: (fn: any) => void;
  modifyBundlerChain: (fn: any) => void;
  getNormalizedConfig: () => any;

  /** The following APIs need to be compatible */
  context: BuilderContext;
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

export type DistPath = DistPathConfig & {
  server?: string;
  worker?: string;
};

export type BuilderConfig = {
  dev?: Omit<DevConfig, 'setupMiddlewares'>;
  html?: Omit<HtmlConfig, 'appIcon'>;
  output?: Omit<OutputConfig, 'polyfill' | 'distPath'> & {
    polyfill?: Polyfill | 'ua';
    distPath?: DistPath;
  };
  server?: {
    rsc?: boolean;
    port?: number;
    cors?: ServerConfig['cors'];
  };
  performance?: RsbuildConfig['performance'];
  security?: Omit<SecurityConfig, 'sri'>;
  tools?: Omit<ToolsConfig, 'htmlPlugin'>;
  resolve?: RsbuildConfig['resolve'];
  source?: Omit<SourceConfig, 'alias' | 'transformImport'>;
  // plugins is a new field, should avoid adding modern plugin by mistake
  plugins?: RsbuildPlugins;
  environments?: {
    [key: string]: EnvironmentConfig & {
      tools?: {
        /**
         * Modify the options of [babel-loader](https://github.com/babel/babel-loader)
         */
        babel?: PluginBabelOptions['babelLoaderOptions'];
      };
    };
  };
} & BuilderExtraConfig;
