import { CliNormalizedConfig, IAppContext } from '@modern-js/core';
import { createToolsConfig } from '../builder/createToolsConfig';
import { createOutputConfig } from '../builder/createOutputConfig';
import { createHtmlConfig } from '../builder/createHtmlConfig';
import { LegacyAppTools, AppTools } from '../types';
import { createSourceConfig } from '../builder/createSourceConfig';

export function transformNormalizedConfig(
  config: CliNormalizedConfig<LegacyAppTools>,
  appContex: IAppContext,
): CliNormalizedConfig<AppTools> {
  const html = createHtmlConfig(config, appContex)!;
  const transformedOutput = createOutputConfig(config, appContex);
  const transformedSource = createSourceConfig(config, appContex);
  const transformedTools = createToolsConfig(config);
  const {
    bff,
    dev,
    deploy,
    runtime,
    runtimeByEntries,
    server,
    cliOptions,
    _raw,
    source,
    tools,
    plugins,
    testing,
    output,
    // source,
  } = config;
  return {
    source: {
      ...transformedSource,
      entries: source.entries,
      enableAsyncEntry: source.enableAsyncEntry,
      disableDefaultEntries: source.disableDefaultEntries,
      entriesDir: source.entriesDir,
      configDir: source.configDir,
    },
    html,
    output: {
      ...transformedOutput,
      ssg: output.ssg,
      enableModernMode: output.enableModernMode,
      disableCssExtract: output.disableCssExtract,
      disableNodePolyfill: output.disableNodePolyfill,
    },
    tools: {
      ...transformedTools,
      devServer: tools.devServer,
      tailwindcss: tools.tailwindcss,
      jest: tools.jest,
      esbuild: tools.esbuild,
    },
    bff,
    dev,
    deploy,
    runtime,
    runtimeByEntries,
    server,
    cliOptions,
    _raw: _raw as any,
    testing,
    plugins: plugins as any,
  } as any;
}
