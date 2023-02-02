import type { AppNormalizedConfig, IAppContext } from '../../types';
import { initHtmlConfig, initSourceConfig, initToolsConfig } from './inits';

export function initialNormalizedConfig(
  config: AppNormalizedConfig,
  appContext: IAppContext,
  bundler: 'webpack' | 'rspack',
): AppNormalizedConfig {
  initHtmlConfig(config, appContext);
  initSourceConfig(config, appContext, bundler);
  if (bundler === 'webpack') {
    initToolsConfig(config as AppNormalizedConfig<'webpack'>);
  }

  return config;
}
