import type { AppNormalizedConfig } from '../../types';
import type { AppToolsContext } from '../../types/new';
import { initHtmlConfig, initSourceConfig } from './inits';

export function initialNormalizedConfig(
  config: AppNormalizedConfig<'shared'>,
  appContext: AppToolsContext<'shared'>,
  bundler: 'webpack' | 'rspack',
): AppNormalizedConfig<'shared'> {
  initHtmlConfig(config, appContext);
  initSourceConfig(config, appContext, bundler);

  return config;
}
