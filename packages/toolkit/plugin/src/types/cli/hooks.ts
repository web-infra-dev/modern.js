import type {
  ServerPlugin as ServerPluginConfig,
  ServerRoute,
} from '@modern-js/types';
import type { Command } from '@modern-js/utils/commander';
import type {
  ModifyBundlerChainUtils,
  ModifyRspackConfigUtils,
  RsbuildConfig,
  Rspack,
  RspackChain,
} from '@rsbuild/core';
import type { TransformFunction } from '../plugin';
import type { MaybePromise } from '../utils';
import type { Entrypoint } from './context';

declare module '@modern-js/utils/commander' {
  export interface Command {
    commandsMap: Map<string, Command>;
  }
}

export interface RuntimePluginConfig {
  name: string;
  path: string;
  config: Record<string, any>;
}

export type { ServerPluginConfig };

export type ConfigFn<Config> = () => Config | Promise<Config>;

export type ModifyConfigFn<Config, ExtendConfigUtils> = (
  arg: Config,
  utils?: ExtendConfigUtils,
) => Config | Promise<Config>;

export type ModifyResolvedConfigFn<NormalizedConfig, ExtendConfigUtils> = (
  arg: NormalizedConfig,
  utils?: ExtendConfigUtils,
) => NormalizedConfig | Promise<NormalizedConfig>;

type IPartialMethod = (...script: string[]) => void;
export interface PartialMethod {
  append: IPartialMethod;
  prepend: IPartialMethod;
}

export type ModifyHtmlPartialsFn = (params: {
  entrypoint: Entrypoint;
  partials: {
    top: PartialMethod;
    head: PartialMethod;
    body: PartialMethod;
  };
}) => Promise<void> | void;

export type AddCommandFn = (params: { program: Command }) => void;

export type OnPrepareFn = () => Promise<void> | void;

type WatchFilesReturnType =
  | Array<string>
  | { files: string[]; isPrivate: boolean };
export type AddWatchFilesFn = () =>
  | WatchFilesReturnType
  | Promise<WatchFilesReturnType>;

export type OnFileChangedFn = (params: {
  filename: string;
  eventType: 'add' | 'change' | 'unlink';
  isPrivate: boolean;
}) => void;

export type OnBeforeRestartFn = () => Promise<void> | void;

export type OnBeforeDevFn = () => Promise<void> | void;

export type OnAfterDevFn = (params: { port: number }) => Promise<void> | void;

export type OnBeforeDeployFn = (
  options?: Record<string, any>,
) => Promise<void> | void;

export type OnAfterDeployFn = (
  options?: Record<string, any>,
) => Promise<void> | void;

export type OnBeforeExitFn = () => Promise<void> | void;

export type ModifyBundlerChainFn<ExtendsUtils> = (
  chain: RspackChain,
  utils: ModifyBundlerChainUtils & ExtendsUtils,
) => MaybePromise<void>;

// todo replace to use rsbuild type after update rsbuild lib version
export type ModifyRsbuildConfigUtils = {
  /** Merge multiple Rsbuild config objects into one. */
  mergeRsbuildConfig: (...configs: RsbuildConfig[]) => RsbuildConfig;
};
export type ModifyRsbuildConfigFn<ExtendsUtils> = (
  config: RsbuildConfig,
  utils: ModifyRsbuildConfigUtils & ExtendsUtils,
) => MaybePromise<RsbuildConfig | void>;

export type ModifyRspackConfigFn<ExtendsUtils> = (
  config: Rspack.Configuration,
  utils: ModifyRspackConfigUtils & ExtendsUtils,
) => MaybePromise<Rspack.Configuration | void>;

export type InternalRuntimePluginsFn = TransformFunction<{
  entrypoint: Entrypoint;
  plugins: RuntimePluginConfig[];
}>;
export type InternalServerPluginsFn = TransformFunction<{
  plugins: ServerPluginConfig[];
}>;
export type ModifyServerRoutesFn = TransformFunction<{ routes: ServerRoute[] }>;
