import type {
  AppLegacyNormalizedConfig,
  AppLegacyUserConfig,
  AppNormalizedConfig,
  AppUserConfig,
} from '../../types';
import { createToolsConfig } from './createToolsConfig';
import { createSourceConfig } from './createSourceConfig';
import { createOutputConfig } from './createOutputConfig';
import { createHtmlConfig } from './createHtmlConfig';

export function transformNormalizedConfig(
  config: AppLegacyNormalizedConfig,
): AppNormalizedConfig<'webpack'> {
  const html = createHtmlConfig(config);
  const output = createOutputConfig(config);
  const source = createSourceConfig(config);
  const tools = createToolsConfig(config);
  const {
    bff,
    dev,
    deploy,
    runtime,
    runtimeByEntries,
    server,
    cliOptions,
    plugins,
    autoLoadPlugins,
  } = config;
  return {
    source,
    html,
    output,
    tools,
    bff,
    dev,
    deploy,
    runtime,
    runtimeByEntries,
    server,
    cliOptions,
    devtools: {},
    builderPlugins: [],
    plugins: plugins as any,
    security: {},
    _raw: {},
    experiments: {},
    autoLoadPlugins,
    performance: {
      removeMomentLocale: true,
    },
  };
}

export function checkIsLegacyConfig(
  config: AppLegacyUserConfig | AppUserConfig<'shared'>,
): config is AppLegacyUserConfig {
  return Boolean((config as AppLegacyUserConfig).legacy);
}
