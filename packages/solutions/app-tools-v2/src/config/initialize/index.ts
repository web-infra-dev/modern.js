import type { AppNormalizedConfig, IAppContext } from '../../types';
import { initHtmlConfig, initSourceConfig } from './inits';

export function initialNormalizedConfig(
  config: AppNormalizedConfig<'shared'>,
  appContext: IAppContext,
  bundler: 'webpack' | 'rspack',
): AppNormalizedConfig<'shared'> {
  initHtmlConfig(config, appContext);
  initSourceConfig(config, appContext, bundler);

  return config;
}
