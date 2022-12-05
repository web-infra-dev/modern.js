import {
  AppNormalizedConfig,
  IAppContext,
  AppLegacyUserConfig,
  AppUserConfig,
} from '../../types';
import { initHtmlConfig, initSourceConfig, initToolsConfig } from './inits';

export { transformNormalizedConfig } from './transformNormalizedConfig';

export function checkIsLegacyConfig(
  config: AppLegacyUserConfig | AppUserConfig,
): config is AppLegacyUserConfig {
  return Boolean((config as AppLegacyUserConfig).legacy);
}

export function initialNormalizedConfig(
  config: AppNormalizedConfig,
  appContext: IAppContext,
): AppNormalizedConfig {
  initHtmlConfig(config, appContext);
  initSourceConfig(config, appContext);
  initToolsConfig(config);

  return config;
}
