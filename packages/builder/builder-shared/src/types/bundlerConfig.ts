import { Configuration } from 'webpack';
import type { WebpackChain } from '@modern-js/utils';

interface BundlerPluginInstance {
  [index: string]: any;

  apply: (compiler: {
    hooks: {
      compilation: {
        tap: any;
      };
    };
  }) => void;
}

type SplitChunks = Configuration extends {
  optimization?: {
    splitChunks?: infer P;
  };
}
  ? P
  : never;

type WebpackOptimization = NonNullable<Configuration['optimization']>;
type WebpackResolve = NonNullable<Configuration['resolve']>;
type WebpackOutput = NonNullable<Configuration['output']>;
type WebpackInfrastructureLogging = NonNullable<
  Configuration['infrastructureLogging']
>;

// fork from the @rspack/core
type RspackResolve = {
  preferRelative?: boolean;
  extensions?: string[];
  mainFiles?: string[];
  mainFields?: string[];
  browserField?: boolean;
  conditionNames?: string[];
  alias?: Record<string, false | string | string[]>;
  tsConfigPath?: string;
  modules?: string[];
  fallback?: Record<string, false | string>;
};

// fork from the @rspack/core
type RspackOutput = {
  libraryTarget?: string;
  path?: string;
  publicPath?: string;
  assetModuleFilename?: string;
  filename?: string;
  chunkFilename?: string;
  uniqueName?: string;
  hashFunction?: string;
  cssFilename?: string;
  cssChunkFilename?: string;
  library?: string;
  chunkLoadingGlobal?: string;
  crossOriginLoading?: false | 'anonymous' | 'use-credentials';
};

// fork from the @rspack/core
type FilterTypes = FilterItemTypes[] | FilterItemTypes;
type FilterItemTypes = RegExp | string | ((value: string) => boolean);
export interface RspackInfrastructureLogging {
  appendOnly?: boolean;
  colors?: boolean;
  console?: Console;
  debug?: boolean | FilterTypes;
  level?: 'none' | 'error' | 'warn' | 'info' | 'log' | 'verbose';
  stream?: NodeJS.WritableStream;
}

type Overlap<
  T extends Record<string, any>,
  E extends Record<string, any>,
  Key extends Extract<keyof T, keyof E> = Extract<keyof T, keyof E>,
> = {
  [key in Key]: Extract<E[key], T[key]>;
};

type Resolve = Overlap<WebpackResolve, RspackResolve>;
type Output = Overlap<WebpackOutput, RspackOutput>;
type InfrastructureLogging = Overlap<
  WebpackInfrastructureLogging,
  RspackInfrastructureLogging
>;

type Externals = Configuration['externals'];

/** The intersection of webpack and Rspack */
export type BundlerConfig = {
  name?: string;
  entry?: Record<string, string | string[]>;
  context?: Configuration['context'];
  plugins?: BundlerPluginInstance[];
  module?: Configuration['module'];
  target?: Configuration['target'];
  mode?: Configuration['mode'];
  externals?: Externals;
  externalsType?: Configuration['externalsType'];
  externalsPresets?: Configuration['externalsPresets'];
  output?: Output;
  resolve?: Resolve;
  devtool?: Configuration['devtool'];
  infrastructureLogging?: InfrastructureLogging;
  //   stats?: StatsOptions;
  //   snapshot?: Snapshot;
  cache?: Configuration['cache'];
  optimization?: {
    splitChunks: SplitChunks;
    runtimeChunk?: WebpackOptimization['runtimeChunk'];
  };
  //   experiments?: RawExperiments;
};

// excludeAny: any extends boolean/string/xxx ? A : B  => A | B;
type ExtendsExcludeAny<T, E> = T extends any
  ? T extends E
    ? true
    : false
  : false;

/**
 * use `fn: (...args) => BundlerChain` instead of `fn: (...args) => WebpackChain`
 */
type ModifyReturnThis<F extends (...args: any) => any, R = ReturnType<F>> = (
  ...values: Parameters<F>
) => ExtendsExcludeAny<R, WebpackChain> extends true
  ? BundlerChain
  : ExtendsExcludeAny<R, Record<string, any>> extends true
  ? PickAndModifyThis<R>
  : R;

/**
 * use `{ a: () => BundlerChain; b: { c: () => BundlerChain }}` instead of `{ a: () => WebpackChain; b: { c: () => WebpackChain }}`
 */
type PickAndModifyThis<T, K extends keyof T = keyof T> = {
  [P in K]: T[P] extends (...args: any) => any
    ? ModifyReturnThis<T[P]>
    : ExtendsExcludeAny<T[P], Record<string, any>> extends true
    ? PickAndModifyThis<T[P]>
    : T[P];
};

export interface BundlerChain
  extends PickAndModifyThis<
    WebpackChain,
    | 'devtool'
    | 'target'
    | 'name'
    | 'merge'
    | 'cache'
    | 'plugin'
    | 'plugins'
    | 'entryPoints'
    | 'mode'
    | 'context'
    | 'externalsType'
    | 'externalsPresets'
    | 'entry'
    | 'get'
    | 'experiments'
    | 'profile'
    | 'ignoreWarnings'
  > {
  toConfig: () => BundlerConfig;
  optimization: PickAndModifyThis<
    WebpackChain['optimization'],
    | 'splitChunks'
    | 'runtimeChunk'
    | 'minimize'
    | 'minimizer'
    | 'chunkIds'
    | 'moduleIds'
    | 'sideEffects'
    | 'realContentHash'
    | 'removeEmptyChunks'
    | 'removeAvailableModules'
  >;
  externals: (value: Externals) => BundlerChain;
  resolve: PickAndModifyThis<
    WebpackChain['resolve'],
    | Extract<
        Extract<keyof WebpackResolve, keyof RspackResolve>,
        keyof WebpackChain['resolve']
      >
    | 'merge'
    | 'get'
  >;
  output: PickAndModifyThis<
    WebpackChain['output'],
    | Extract<
        Extract<keyof WebpackOutput, keyof RspackOutput>,
        keyof WebpackChain['output']
      >
    | 'get'
    | 'merge'
  >;
  infrastructureLogging: PickAndModifyThis<
    WebpackChain['infrastructureLogging'],
    Extract<
      Extract<
        keyof WebpackInfrastructureLogging,
        keyof RspackInfrastructureLogging
      >,
      keyof WebpackChain['infrastructureLogging']
    >
  >;
  module: PickAndModifyThis<WebpackChain['module'], 'rules' | 'rule'>;
}

export type WebpackChainRule = WebpackChain.Rule;
export type BundlerChainRule = PickAndModifyThis<WebpackChain.Rule>;
