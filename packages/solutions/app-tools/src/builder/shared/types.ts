import type { AppNormalizedConfig } from '../../types';
import type { AppToolsContext } from '../../types/plugin';

export type BuilderOptions = {
  normalizedConfig: AppNormalizedConfig;
  appContext: AppToolsContext;
};
