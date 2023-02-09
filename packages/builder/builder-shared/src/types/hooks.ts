import type { ChainIdentifier } from '@modern-js/utils';
import type { Stats, MultiStats } from './stats';
import { NodeEnv, PromiseOrNot } from './utils';
import { BuilderTarget } from './builder';
import { BundlerChain } from './bundlerConfig';
import { mergeBuilderConfig } from '../mergeBuilderConfig';

export type OnBeforeBuildFn<BundlerConfig = unknown> = (params: {
  bundlerConfigs?: BundlerConfig[];
}) => PromiseOrNot<void>;

export type OnAfterBuildFn = (params: {
  stats?: Stats | MultiStats;
}) => PromiseOrNot<void>;

export type OnDevCompileDoneFn = (params: {
  isFirstCompile: boolean;
}) => PromiseOrNot<void>;

export type OnBeforeStartDevServerFn = () => PromiseOrNot<void>;

export type OnAfterStartDevServerFn = (params: {
  port: number;
}) => PromiseOrNot<void>;

export type OnBeforeCreateCompilerFn<BundlerConfig = unknown> = (params: {
  bundlerConfigs: BundlerConfig[];
}) => PromiseOrNot<void>;

export type OnAfterCreateCompilerFn<Compiler = unknown> = (params: {
  compiler: Compiler;
}) => PromiseOrNot<void>;

export type OnExitFn = () => void;

export type ModifyBuilderConfigUtils = {
  /** Merge multiple builder config objects into one. */
  mergeBuilderConfig: typeof mergeBuilderConfig;
};

export type ModifyBuilderConfigFn<BuilderConfig> = (
  config: BuilderConfig,
  utils: ModifyBuilderConfigUtils,
) => PromiseOrNot<BuilderConfig | void>;

export type ModifyChainUtils = {
  env: NodeEnv;
  isProd: boolean;
  target: BuilderTarget;
  isServer: boolean;
  isWebWorker: boolean;
  CHAIN_ID: ChainIdentifier;
  getCompiledPath: (name: string) => string;
};

export type ModifyBundlerChainUtils = ModifyChainUtils;

/** The intersection of webpack-chain and rspack-chain */
export type ModifyBundlerChainFn = (
  chain: BundlerChain,
  utils: ModifyBundlerChainUtils,
) => PromiseOrNot<void>;

export type CreateAsyncHook<Callback extends (...args: any[]) => any> = {
  tap: (cb: Callback) => void;
  call: (...args: Parameters<Callback>) => Promise<Parameters<Callback>>;
};
