import { Configuration } from 'webpack';
import type Config from '../../compiled/webpack-5-chain';

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
  alias?: Record<string, string>;
  tsConfigPath?: string;
};

// fork from the @rspack/core
type RspackOutput = {
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

/** The intersection of webpack and rspack */
export type BundlerConfig = {
  name?: string;
  entry?: Record<string, string | string[]>;
  context?: Configuration['context'];
  plugins?: BundlerPluginInstance[];
  module?: Configuration['module'];
  target?: Configuration['target'];
  mode?: Configuration['mode'];
  //   externals?: External;
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

export interface BundlerChain
  extends Pick<
    Config,
    | 'devtool'
    | 'target'
    | 'name'
    | 'merge'
    | 'cache'
    | 'plugin'
    | 'entryPoints'
    | 'mode'
    | 'context'
  > {
  toConfig: () => BundlerConfig;
  optimization: Pick<Config['optimization'], 'splitChunks' | 'runtimeChunk'>;
  resolve: Pick<
    Config['resolve'],
    Extract<
      Extract<keyof WebpackResolve, keyof RspackResolve>,
      keyof Config['resolve']
    >
  >;
  output: Pick<
    Config['output'],
    | Extract<
        Extract<keyof WebpackOutput, keyof RspackOutput>,
        keyof Config['output']
      >
    | 'get'
  >;
  infrastructureLogging: Pick<
    Config['infrastructureLogging'],
    Extract<
      Extract<
        keyof WebpackInfrastructureLogging,
        keyof RspackInfrastructureLogging
      >,
      keyof Config['infrastructureLogging']
    >
  >;
  /** only support add string | string[] */
  entry: Config['entry'];
  module: Pick<Config['module'], 'rules' | 'rule'>;
}

export type BundlerChainRule = Config.Rule;
