import { Configuration } from 'webpack';
import type Config from '../../compiled/webpack-5-chain';
import { NodeEnv } from './utils';
import { BuilderTarget } from './builder';

/** The intersection of webpack and rspack */
export type BundlerConfig = {
  name?: string;
  //   entry?: Configuration['entry'];
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
  //   cache?: Cache;
  //   optimization?: Optimization;
  //   experiments?: RawExperiments;
};

export interface BundlerChain
  extends Pick<Config, 'devtool' | 'target' | 'name' | 'merge'> {
  toConfig: () => BundlerConfig;
}

export type ModifyBundlerChainUtils = {
  env: NodeEnv;
  isProd: boolean;
  target: BuilderTarget;
  isServer: boolean;
  isWebWorker: boolean;
};

/** The intersection of webpack-chain and rspack-chain */
export type ModifyBundlerChainFn = (
  chain: BundlerChain,
  utils: ModifyBundlerChainUtils,
) => Promise<void> | void;
