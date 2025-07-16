import type { AppNormalizedConfig } from '../../types';
import type { AppToolsContext } from '../../types/new';
import { initHtmlConfig, initSourceConfig } from './inits';

export function initialNormalizedConfig(
  config: AppNormalizedConfig,
  appContext: AppToolsContext,
): AppNormalizedConfig {
  initHtmlConfig(config, appContext);
  initSourceConfig(config, appContext);

  return config;
}
