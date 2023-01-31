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

/** The intersection of webpack and rspack */
export type BundlerConfig = {
  name?: string;
  entry?: Record<string, string | string[]>;
  //   context?: Context;
  plugins?: BundlerPluginInstance[];
  module?: Configuration['module'];
  target?: Configuration['target'];
  //   mode?: Mode;
  //   externals?: External;
  //   output?: Output;
  //   resolve?: Resolve;
  devtool?: Configuration['devtool'];
  //   infrastructureLogging?: InfrastructureLogging;
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
    'devtool' | 'target' | 'name' | 'merge' | 'cache' | 'plugin' | 'entryPoints'
  > {
  toConfig: () => BundlerConfig;
  optimization: Pick<Config['optimization'], 'splitChunks' | 'runtimeChunk'>;
  /** only support add string | string[] */
  entry: Config['entry'];
  module: Pick<Config['module'], 'rules' | 'rule'>;
}
