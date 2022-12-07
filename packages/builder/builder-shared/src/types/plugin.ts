import type {
  OnExitFn,
  OnAfterBuildFn,
  OnBeforeBuildFn,
  OnDevCompileDoneFn,
  OnAfterStartDevServerFn,
  OnBeforeStartDevServerFn,
} from './hooks';
import { BuilderContext } from './context';
import type { SharedBuilderConfig, ShareNormalizedConfig } from './config';

export type PluginStore = {
  readonly plugins: BuilderPlugin[];
  addPlugins: (plugins: BuilderPlugin[], options?: { before?: string }) => void;
  removePlugins: (pluginNames: string[]) => void;
  isPluginExists: (pluginName: string) => boolean;
};

export type BuilderPlugin<API = any> = {
  name: string;
  setup: (api: API) => Promise<void> | void;
};

type PluginsFn = () => Promise<BuilderPlugin>;

export type Plugins = {
  cleanOutput: PluginsFn;
  startUrl: PluginsFn;
};

/**
 * Define a generic builder plugin API that provider can extend as needed.
 */
export type DefaultBuilderPluginAPI<
  Config extends SharedBuilderConfig = SharedBuilderConfig,
> = {
  context: Readonly<BuilderContext>;

  onExit: (fn: OnExitFn) => void;
  onAfterBuild: (fn: OnAfterBuildFn) => void;
  onBeforeBuild: (fn: OnBeforeBuildFn) => void;
  onDevCompileDone: (fn: OnDevCompileDoneFn) => void;
  onAfterStartDevServer: (fn: OnAfterStartDevServerFn) => void;
  onBeforeStartDevServer: (fn: OnBeforeStartDevServerFn) => void;

  getBuilderConfig: () => Readonly<Config>;
  getNormalizedConfig: () => Readonly<ShareNormalizedConfig>;
};

export type DefaultBuilderPlugin = BuilderPlugin<DefaultBuilderPluginAPI>;
