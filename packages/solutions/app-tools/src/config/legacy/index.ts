import type {
  AppLegacyNormalizedConfig,
  AppLegacyUserConfig,
  AppNormalizedConfig,
  AppUserConfig,
} from '../../types';
import { createHtmlConfig } from './createHtmlConfig';
import { createOutputConfig } from './createOutputConfig';
import { createSourceConfig } from './createSourceConfig';
import { createToolsConfig } from './createToolsConfig';

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
    testing,
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
    testing,
    devtools: {},
    builderPlugins: [],
    plugins: plugins as any,
    security: {},
    _raw: {},
    experiments: {},
    environments: {},
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
