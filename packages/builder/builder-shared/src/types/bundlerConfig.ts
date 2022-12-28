import { Configuration } from 'webpack';
import type Config from '../../compiled/webpack-5-chain';

/** The intersection of webpack and rspack */
export type BundlerConfig = {
  name?: string;
  entry?: Record<string, string | string[]>;
  //   context?: Context;
  //   plugins?: PluginInstance[];
  //   module?: Module;
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
  //   optimization?: Optimization;
  //   experiments?: RawExperiments;
};

export interface BundlerChain
  extends Pick<Config, 'devtool' | 'target' | 'name' | 'merge' | 'cache'> {
  toConfig: () => BundlerConfig;
  /** only support add string | string[] */
  entry: Config['entry'];
}
