import type { AppNormalizedConfig, IAppContext } from '../../types';
import { initHtmlConfig, initSourceConfig, initToolsConfig } from './inits';

export function initialNormalizedConfig(
  config: AppNormalizedConfig<'shared'>,
  appContext: IAppContext,
  bundler: 'webpack' | 'rspack',
): AppNormalizedConfig<'shared'> {
  initHtmlConfig(config, appContext);
  initSourceConfig(config, appContext, bundler);
  if (bundler === 'webpack') {
    initToolsConfig(config as AppNormalizedConfig<'webpack'>);
  }

  return config;
}
