import type { AppNormalizedConfig } from '../../types';
import type { AppToolsContext } from '../../types/new';
import { initHtmlConfig, initSourceConfig } from './inits';

export function initialNormalizedConfig(
  config: AppNormalizedConfig,
  appContext: AppToolsContext,
  bundler: 'webpack' | 'rspack',
): AppNormalizedConfig {
  initHtmlConfig(config, appContext);
  initSourceConfig(config, appContext, bundler);

  return config;
}
