import type { BuilderContext } from './context';
import type { PluginStore } from './plugin';
import type { BuilderProvider, ProviderInstance } from './provider';

export type BuilderTarget = 'web' | 'node' | 'modern-web' | 'web-worker';

export type BuilderEntry = Record<string, string | string[]>;

export type BuilderMode = 'development' | 'production';

export type CreateBuilderOptions = {
  /** The root path of current project. */
  cwd?: string;
  /** The entry points object. */
  entry?: BuilderEntry;
  /** Type of build target. */
  target?: BuilderTarget | BuilderTarget[];
  /** Framework name, such as 'modern.js' */
  framework?: string;
  /** Absolute path of framework config file. */
  configPath?: string | null;
};

export type BuilderInstance<P extends BuilderProvider = BuilderProvider> = {
  context: BuilderContext;

  addPlugins: PluginStore['addPlugins'];
  removePlugins: PluginStore['removePlugins'];
  isPluginExists: PluginStore['isPluginExists'];

  build: ProviderInstance['build'];
  inspectConfig: ProviderInstance['inspectConfig'];
  createCompiler: ProviderInstance['createCompiler'];
  startDevServer: ProviderInstance['startDevServer'];

  onBeforeBuild: Awaited<ReturnType<P>>['pluginAPI']['onBeforeBuild'];
  onBeforeCreateCompiler: Awaited<
    ReturnType<P>
  >['pluginAPI']['onBeforeCreateCompiler'];
  onBeforeStartDevServer: Awaited<
    ReturnType<P>
  >['pluginAPI']['onBeforeStartDevServer'];
  onAfterBuild: Awaited<ReturnType<P>>['pluginAPI']['onAfterBuild'];
  onAfterCreateCompiler: Awaited<
    ReturnType<P>
  >['pluginAPI']['onAfterCreateCompiler'];
  onAfterStartDevServer: Awaited<
    ReturnType<P>
  >['pluginAPI']['onAfterStartDevServer'];
  onExit: Awaited<ReturnType<P>>['pluginAPI']['onExit'];
};
