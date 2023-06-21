import type {
  BuilderPluginAPI as WebpackBuilderPluginAPI,
  BuilderConfig as WebpackBuilderConfig,
  NormalizedConfig as WebpackNormalizedConfig,
} from '@modern-js/builder-webpack-provider';
import type {
  BuilderPluginAPI as RspackBuilderPluginAPI,
  BuilderConfig as RspackBuilderConfig,
  NormalizedConfig as RspackNormalizedConfig,
} from '@modern-js/builder-rspack-provider';
import type {
  BuilderInstance,
  DefaultBuilderPluginAPI,
} from '@modern-js/builder-shared';
import type { Bundler, AppNormalizedConfig, IAppContext } from '../../types';

export { WebpackBuilderConfig, RspackBuilderConfig };

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

export type ModifyBuilderInstance = (
  builder: BuilderInstance,
) => Promise<void> | void;

export type BuilderConfig = RspackBuilderConfig | WebpackBuilderConfig;
export type BuilderNormalizedConfig =
  | RspackNormalizedConfig
  | WebpackNormalizedConfig;
export type BuilderPluginAPI = DefaultBuilderPluginAPI<
  BuilderConfig,
  BuilderNormalizedConfig
>;
