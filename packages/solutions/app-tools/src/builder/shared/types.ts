import type { Bundler, AppNormalizedConfig, IAppContext } from '../../types';

export type BuilderOptions<B extends Bundler> = {
  normalizedConfig: AppNormalizedConfig<B>;
  appContext: IAppContext;
};
