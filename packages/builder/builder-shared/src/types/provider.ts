import type { PluginStore } from './plugin';
import type { BuilderContext } from './context';
import type { Compiler, MultiCompiler } from 'webpack';
import type { BuilderMode, CreateBuilderOptions } from './builder';
import type { Server, ModernDevServerOptions } from '@modern-js/server';

export type Bundler = 'webpack' | 'rspack';

export type CreateCompilerOptions = { watch?: boolean };

export type StartDevServerOptions = {
  compiler?: Compiler | MultiCompiler;
  printURLs?: boolean;
  strictPort?: boolean;
  serverOptions?: Partial<Omit<ModernDevServerOptions, 'config'>> & {
    config?: Partial<ModernDevServerOptions['config']>;
  };
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

export type StartDevServerResult = {
  urls: string[];
  port: number;
  server: Server;
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

  startDevServer: (
    options?: StartDevServerOptions,
  ) => Promise<StartDevServerResult>;

  build: (options?: BuildOptions) => Promise<void>;

  inspectConfig: (
    options?: InspectConfigOptions,
  ) => Promise<{ builderConfig: string; bundlerConfigs: string[] }>;
};
