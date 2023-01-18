import type { BuilderPluginAPI } from '@modern-js/builder-webpack-provider';
import { BuilderInstance } from '@modern-js/builder-shared';
import { AppNormalizedConfig, Bundler, IAppContext } from '@/types';

type Parameter<T extends (arg: any) => void> = Parameters<T>[0];
type FnParameter<
  T extends {
    [p: string]: (arg: any) => void;
  },
> = {
  [P in keyof T]: Parameter<T[P]>;
};

type BuilderPluginCallbacks = FnParameter<
  Partial<
    Pick<
      BuilderPluginAPI,
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
} & BuilderPluginCallbacks;

export type ModifyBuilderConfig<B extends Bundler> = (
  config: AppNormalizedConfig<B>,
) => Promise<void> | void;

export type ModifyBuilderInstance = (
  builder: BuilderInstance,
) => Promise<void> | void;
