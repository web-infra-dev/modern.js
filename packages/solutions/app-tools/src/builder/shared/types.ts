import type { AppToolsContext } from '../../new/types';
import type { AppNormalizedConfig, Bundler } from '../../types';

export type BuilderOptions<B extends Bundler> = {
  normalizedConfig: AppNormalizedConfig<B>;
  appContext: AppToolsContext<B>;
};
