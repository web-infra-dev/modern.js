import type { Stats, MultiStats } from './stats';

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
