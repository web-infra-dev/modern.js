import type { BuilderPluginAPI as WebpackBuilderPluginAPI } from '@modern-js/builder-webpack-provider';
import type { BuilderPluginAPI as RspackBuilderPluginAPI } from '@modern-js/builder-rspack-provider';
import { BuilderInstance } from '@modern-js/builder-shared';
import { AppNormalizedConfig, Bundler, IAppContext } from '../../types';

type Parameter<T extends (arg: any) => void> = Parameters<T>[0];
type FnParameter<
  T extends {
    [p: string]: (arg: any) => void;
  },
> = {
  [P in keyof T]: Parameter<T[P]>;
};

type BuilderPluginCallbacks<B extends Bundler> = FnParameter<
  Partial<
    Pick<
      B extends 'rspack' ? RspackBuilderPluginAPI : WebpackBuilderPluginAPI,
      | 'onAfterBuild'
      | 'onAfterCreateCompiler'
      | 'onAfterStartDevServer'
      | 'onBeforeBuild'
      | 'onBeforeCreateCompiler'
      | 'onBeforeStartDevServer'
      | 'onDevCompileDone'
      | 'onExit'
    >
  >
>;

export type BuilderOptions<B extends Bundler> = {
  normalizedConfig: AppNormalizedConfig<B>;
  appContext: IAppContext;
} & BuilderPluginCallbacks<B>;

export type ModifyBuilderConfig<B extends Bundler> = (
  config: AppNormalizedConfig<B>,
) => Promise<void> | void;

export type ModifyBuilderInstance = (
  builder: BuilderInstance,
) => Promise<void> | void;
