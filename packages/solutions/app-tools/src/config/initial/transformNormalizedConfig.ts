import { AppLegacyNormalizedConfig, AppNormalizedConfig } from '../../types';
import { createToolsConfig } from './createToolsConfig';
import { createSourceConfig } from './createSourceConfig';
import { createOutputConfig } from './createOutputConfig';
import { createHtmlConfig } from './createHtmlConfig';

export function transformNormalizedConfig(
  config: AppLegacyNormalizedConfig,
): AppNormalizedConfig {
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
    builderPlugins: [],
    plugins: plugins as any,
    security: {},
    _raw: {},
    experiments: {},
    performance: {},
  };
}
