import type { AppNormalizedConfig, Bundler } from '../../types';
import type { AppToolsContext } from '../../types/new';

export type BuilderOptions<B extends Bundler> = {
  normalizedConfig: AppNormalizedConfig<B>;
  appContext: AppToolsContext<B>;
};
