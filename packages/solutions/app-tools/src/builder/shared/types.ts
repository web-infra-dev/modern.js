import type { AppNormalizedConfig, Bundler, IAppContext } from '../../types';

export type BuilderOptions<B extends Bundler> = {
  normalizedConfig: AppNormalizedConfig<B>;
  appContext: IAppContext;
};
