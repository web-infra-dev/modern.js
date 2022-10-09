import type { PluginStore } from './plugin';
import type { BuilderContext } from './context';
import type { Compiler, MultiCompiler } from 'webpack';
import type { BuilderMode, CreateBuilderOptions } from './builder';
<<<<<<< HEAD
import type { Server, ModernDevServerOptions } from '@modern-js/server';
=======
>>>>>>> ac5486156 (refactor(builder): split builder and provider (#1804))

export type Bundler = 'webpack' | 'rspack';

export type CreateCompilerOptions = { watch?: boolean };

export type StartDevServerOptions = {
  compiler?: Compiler | MultiCompiler;
<<<<<<< HEAD
  printURLs?: boolean;
  strictPort?: boolean;
  serverOptions?: Partial<ModernDevServerOptions>;
=======
>>>>>>> ac5486156 (refactor(builder): split builder and provider (#1804))
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

<<<<<<< HEAD
export type StartDevServerResult = {
  urls: string[];
  port: number;
  server: Server;
};

=======
>>>>>>> ac5486156 (refactor(builder): split builder and provider (#1804))
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

<<<<<<< HEAD
  startDevServer: (
    options?: StartDevServerOptions,
  ) => Promise<StartDevServerResult>;
=======
  startDevServer: (options?: StartDevServerOptions) => Promise<void>;
>>>>>>> ac5486156 (refactor(builder): split builder and provider (#1804))

  build: (options?: BuildOptions) => Promise<void>;

  inspectConfig: (
    options: InspectConfigOptions,
  ) => Promise<{ builderConfig: string; bundlerConfigs: string[] }>;
};
