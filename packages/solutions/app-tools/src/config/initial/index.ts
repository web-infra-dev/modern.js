import {
  AppLegacyNormalizedConfig,
  AppNormalizedConfig,
  IAppContext,
  AppLegacyUserConfig,
  AppUserConfig,
} from '../../types';
import { transformNormalizedConfig } from './transformNormalizedConfig';
import {
  updateHtmlConfig,
  updateSourceConfig,
  updateToolsConfig,
} from './updates';

export function checkIsLegacyConfig(
  config: AppLegacyUserConfig | AppUserConfig,
): config is AppLegacyUserConfig {
  return Boolean((config as AppLegacyUserConfig).legacy);
}

export function initialNormalizedConfig(
  config: AppLegacyNormalizedConfig | AppNormalizedConfig,
  appContext: IAppContext,
): AppNormalizedConfig {
  const normalizedConfig = checkIsLegacyConfig(config)
    ? transformNormalizedConfig(config)
    : config;

  updateHtmlConfig(normalizedConfig, appContext);
  updateSourceConfig(normalizedConfig, appContext);
  updateToolsConfig(normalizedConfig);

  return normalizedConfig;
}
