import type { Stats, MultiStats } from './stats';
import { NodeEnv } from './utils';
import { BuilderTarget } from './builder';
import { BundlerChain } from './bundlerConfig';

export type OnBeforeBuildFn<BundlerConfig = unknown> = (params: {
  bundlerConfigs?: BundlerConfig[];
}) => Promise<void> | void;

export type OnAfterBuildFn = (params: {
  stats?: Stats | MultiStats;
}) => Promise<void> | void;

export type OnDevCompileDoneFn = (params: {
  isFirstCompile: boolean;
}) => Promise<void> | void;

export type OnBeforeStartDevServerFn = () => Promise<void> | void;

export type OnAfterStartDevServerFn = (params: {
  port: number;
}) => Promise<void> | void;

export type OnBeforeCreateCompilerFn<BundlerConfig = unknown> = (params: {
  bundlerConfigs: BundlerConfig[];
}) => Promise<void> | void;

export type OnAfterCreateCompilerFn<Compiler = unknown> = (params: {
  compiler: Compiler;
}) => Promise<void> | void;

export type OnExitFn = () => void;

export type ModifyBuilderConfigFn<BuilderConfig> = (
  config: BuilderConfig,
) => Promise<BuilderConfig | void> | BuilderConfig | void;

export type ModifyChainUtils = {
  env: NodeEnv;
  isProd: boolean;
  target: BuilderTarget;
  isServer: boolean;
  isWebWorker: boolean;
};

export type ModifyBundlerChainUtils = ModifyChainUtils;

/** The intersection of webpack-chain and rspack-chain */
export type ModifyBundlerChainFn = (
  chain: BundlerChain,
  utils: ModifyBundlerChainUtils,
) => Promise<void> | void;

export type CreateAsyncHook<Callback extends (...args: any[]) => any> = {
  tap: (cb: Callback) => void;
  call: (...args: Parameters<Callback>) => Promise<Parameters<Callback>>;
};
