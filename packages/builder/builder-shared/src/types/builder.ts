import type { BuilderContext } from './context';
import type { PluginStore } from './plugin';
import type { ProviderInstance } from './provider';

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

export type BuilderInstance = {
  context: BuilderContext;

  addPlugins: PluginStore['addPlugins'];
  removePlugins: PluginStore['removePlugins'];
  isPluginExists: PluginStore['isPluginExists'];

  build: ProviderInstance['build'];
  inspectConfig: ProviderInstance['inspectConfig'];
  createCompiler: ProviderInstance['createCompiler'];
  startDevServer: ProviderInstance['startDevServer'];
};
