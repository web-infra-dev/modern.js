import type { PluginStore, Plugins, DefaultBuilderPluginAPI } from './plugin';
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
  compiler?: Compiler | MultiCompiler;
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

export type BuilderProvider<
  BuilderConfig extends Record<string, any> = Record<string, any>,
  BundlerConfig extends Record<string, any> = Record<string, any>,
  NormalizedConfig extends Record<string, any> = Record<string, any>,
  Compiler extends Record<string, any> = Record<string, any>,
> = (options: {
  pluginStore: PluginStore;
  builderOptions: Required<CreateBuilderOptions>;
  plugins: Plugins;
}) => Promise<
  ProviderInstance<BuilderConfig, BundlerConfig, NormalizedConfig, Compiler>
>;

export type ProviderInstance<
  BuilderConfig extends Record<string, any> = Record<string, any>,
  BundlerConfig extends Record<string, any> = Record<string, any>,
  NormalizedConfig extends Record<string, any> = Record<string, any>,
  Compiler extends Record<string, any> = Record<string, any>,
> = {
  readonly bundler: Bundler;

  readonly publicContext: Readonly<BuilderContext>;

  pluginAPI: DefaultBuilderPluginAPI<
    BuilderConfig,
    NormalizedConfig,
    BundlerConfig,
    Compiler
  >;

  applyDefaultPlugins: (pluginStore: PluginStore) => Promise<void>;

  createCompiler: (
    options?: CreateCompilerOptions,
  ) => Promise<Compiler | MultiCompiler>;

  startDevServer: (
    options?: StartDevServerOptions,
  ) => Promise<StartDevServerResult>;

  build: (options?: BuildOptions) => Promise<void>;

  inspectConfig: (options?: InspectConfigOptions) => Promise<{
    builderConfig: string;
    bundlerConfigs: string[];
    origin: {
      builderConfig: BuilderConfig;
      bundlerConfigs: BundlerConfig[];
    };
  }>;
};
