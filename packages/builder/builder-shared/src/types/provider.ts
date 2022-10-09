import type { PluginStore } from './plugin';
import type { BuilderContext } from './context';
import type { Compiler, MultiCompiler } from 'webpack';
import type { BuilderMode, CreateBuilderOptions } from './builder';

export type Bundler = 'webpack' | 'rspack';

export type CreateCompilerOptions = { watch?: boolean };

export type StartDevServerOptions = {
  compiler?: Compiler | MultiCompiler;
  printURLs?: boolean;
  strictPort?: boolean;
};

export type BuildOptions = {
  mode?: BuilderMode;
  watch?: boolean;
};

export type InspectConfigOptions = {
  env?: BuilderMode;
  verbose?: boolean;
  outputPath?: string;
  writeToDisk?: boolean;
};

export type BuilderProvider = (options: {
  pluginStore: PluginStore;
  builderOptions: Required<CreateBuilderOptions>;
}) => Promise<ProviderInstance>;

export type ProviderInstance = {
  readonly bundler: Bundler;

  readonly publicContext: Readonly<BuilderContext>;

  applyDefaultPlugins: (pluginStore: PluginStore) => Promise<void>;

  createCompiler: (
    options?: CreateCompilerOptions,
  ) => Promise<Compiler | MultiCompiler>;

  startDevServer: (options?: StartDevServerOptions) => Promise<{
    urls: string[];
    port: number;
  }>;

  build: (options?: BuildOptions) => Promise<void>;

  inspectConfig: (
    options: InspectConfigOptions,
  ) => Promise<{ builderConfig: string; bundlerConfigs: string[] }>;
};
