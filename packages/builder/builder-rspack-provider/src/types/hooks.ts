import type { NodeEnv, BuilderTarget } from '@modern-js/builder-shared';
import type { BuilderConfig } from './config';
import type { RspackConfig, Stats, Compiler } from './rspack';

export type ModifyRspackConfigUtils = {
  env: NodeEnv;
  isProd: boolean;
  target: BuilderTarget;
  isServer: boolean;
  isWebWorker: boolean;
  getCompiledPath: (name: string) => string;
};

export type ModifyRspackConfigFn = (
  config: RspackConfig,
  utils: ModifyRspackConfigUtils,
) => Promise<RspackConfig | void> | RspackConfig | void;

export type ModifyBuilderConfigFn = (
  config: BuilderConfig,
) => Promise<BuilderConfig | void> | BuilderConfig | void;

export type OnBeforeBuildFn = (params: {
  bundlerConfigs?: RspackConfig[];
}) => Promise<void> | void;

// TODO: support MultiStats
export type OnAfterBuildFn = (params: {
  stats?: Stats;
}) => Promise<void> | void;

export type OnDevCompileDoneFn = (params: {
  isFirstCompile: boolean;
}) => Promise<void> | void;

export type OnBeforeCreateCompilerFn = (params: {
  bundlerConfigs: RspackConfig[];
}) => Promise<void> | void;

// TODO: support MultiCompiler
export type OnAfterCreateCompilerFn = (params: {
  compiler: Compiler;
}) => Promise<void> | void;

export type OnBeforeStartDevServerFn = () => Promise<void> | void;

export type OnAfterStartDevServerFn = (params: {
  port: number;
}) => Promise<void> | void;

export type OnExitFn = () => void;
