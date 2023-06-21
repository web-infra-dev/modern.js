import type {
  BuilderConfig as WebpackBuilderConfig,
  NormalizedConfig as WebpackNormalizedConfig,
} from '@modern-js/builder-webpack-provider';
import type {
  BuilderConfig as RspackBuilderConfig,
  NormalizedConfig as RspackNormalizedConfig,
} from '@modern-js/builder-rspack-provider';
import type {
  BuilderInstance,
  DefaultBuilderPluginAPI,
} from '@modern-js/builder-shared';
import type { Bundler, AppNormalizedConfig, IAppContext } from '../../types';

export { WebpackBuilderConfig, RspackBuilderConfig };

export type BuilderOptions<B extends Bundler> = {
  normalizedConfig: AppNormalizedConfig<B>;
  appContext: IAppContext;
};

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
