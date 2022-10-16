import type { NodeEnv, BuilderTarget } from '@modern-js/builder-shared';
import type { BuilderConfig } from './config';
import type { RspackConfig } from './thirdParty';
import type { ChainIdentifier } from '@modern-js/utils';

export type ModifyRspackUtils = {
  env: NodeEnv;
  isProd: boolean;
  target: BuilderTarget;
  isServer: boolean;
  CHAIN_ID: ChainIdentifier;
  getCompiledPath: (name: string) => string;
};

export type ModifyRspackConfigFn = (
  config: RspackConfig,
  utils: ModifyRspackUtils,
) => Promise<RspackConfig | void> | RspackConfig | void;

export type ModifyBuilderConfigFn = (
  config: BuilderConfig,
) => Promise<BuilderConfig | void> | BuilderConfig | void;

export type OnBeforeBuildFn = (params: {
  bundlerConfigs: RspackConfig[];
}) => Promise<void> | void;

// export type OnAfterBuildFn = (params: {
//   stats?: Stats | MultiStats;
// }) => Promise<void> | void;

export type OnDevCompileDoneFn = (params: {
  isFirstCompile: boolean;
}) => Promise<void> | void;

export type OnBeforeCreateCompilerFn = (params: {
  bundlerConfigs: RspackConfig[];
}) => Promise<void> | void;

// export type OnAfterCreateCompilerFn = (params: {
//   compiler: Compiler | MultiCompiler;
// }) => Promise<void> | void;

export type OnBeforeStartDevServerFn = () => Promise<void> | void;

export type OnAfterStartDevServerFn = (params: {
  port: number;
}) => Promise<void> | void;

export type OnExitFn = () => void;
