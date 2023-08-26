import type { PluginStore, Plugins, DefaultBuilderPluginAPI } from './plugin';
import type { BuilderContext } from './context';
import type { Compiler, MultiCompiler } from 'webpack';
import type { BuilderMode, CreateBuilderOptions } from './builder';
import type { Server, ModernDevServerOptions } from '@modern-js/server';
import type { AddressUrl } from '@modern-js/utils';
import { Logger } from '@modern-js/prod-server';

export type Bundler = 'webpack' | 'rspack';

export type CreateCompilerOptions = { watch?: boolean };

export type StartDevServerOptions = {
  compiler?: Compiler | MultiCompiler;
  printURLs?: boolean | ((urls: AddressUrl[]) => AddressUrl[]);
  logger?: Logger;
  strictPort?: boolean;
  getPortSilently?: boolean;
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

export type StartServerResult = {
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
  CommonCompiler extends Record<string, any> = Record<string, any>,
> = {
  readonly bundler: Bundler;

  readonly publicContext: Readonly<BuilderContext>;

  pluginAPI: DefaultBuilderPluginAPI<
    BuilderConfig,
    NormalizedConfig,
    BundlerConfig,
    CommonCompiler
  >;

  applyDefaultPlugins: (pluginStore: PluginStore) => Promise<void>;

  // TODO using common compiler type
  createCompiler: (
    options?: CreateCompilerOptions,
  ) => Promise<Compiler | MultiCompiler>;

  startDevServer: (
    options?: StartDevServerOptions,
  ) => Promise<StartServerResult>;

  serve: () => Promise<StartServerResult>;

  build: (options?: BuildOptions) => Promise<void>;

  initConfigs: () => Promise<BundlerConfig[]>;

  inspectConfig: (options?: InspectConfigOptions) => Promise<{
    builderConfig: string;
    bundlerConfigs: string[];
    origin: {
      builderConfig: BuilderConfig;
      bundlerConfigs: BundlerConfig[];
    };
  }>;
};
