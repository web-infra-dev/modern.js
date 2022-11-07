import {
  BuilderInstance,
  BuilderTarget,
  createBuilder,
  CreateBuilderOptions,
} from '@modern-js/builder';
import {
  BuilderConfig,
  builderWebpackProvider,
} from '@modern-js/builder-webpack-provider';
import type { IAppContext, NormalizedConfig } from '@modern-js/core';
import { applyOptionsChain } from '@modern-js/utils';

import {
  PluginCompatModernOptions,
  PluginCompatModern,
} from './builderPlugins/compatModern';
import { createHtmlConfig } from './createHtmlConfig';
import { createOutputConfig } from './createOutputConfig';
import { createSourceConfig } from './createSourceConfig';
import { createToolsConfig } from './createToolsConfig';

export type BuilderOptions = {
  target?: BuilderTarget | BuilderTarget[];
  normalizedConfig: NormalizedConfig;
  appContext: IAppContext;
  compatPluginConfig?: PluginCompatModernOptions;
};

export default async ({
  target = 'web',
  normalizedConfig,
  appContext,
  compatPluginConfig,
}: BuilderOptions) => {
  const targets = Array.isArray(target) ? target : [target];
  if (
    normalizedConfig.output.enableModernMode &&
    !targets.includes('modern-web')
  ) {
    targets.push('modern-web');
  }

  const builderConfig = createBuilderProviderConfig(
    normalizedConfig,
    appContext,
  );
  // create webpack provider
  const webpackProvider = builderWebpackProvider({ builderConfig });

  const builderOptions = createBuilderOptions(target, appContext);
  const builder = await createBuilder(webpackProvider, builderOptions);

  await applyBuilderPlugins(
    builder,
    normalizedConfig,
    appContext,
    compatPluginConfig,
  );

  return builder;
};

function createBuilderProviderConfig(
  normalizedConfig: NormalizedConfig,
  appContext: IAppContext,
): BuilderConfig {
  const source = createSourceConfig(normalizedConfig, appContext);
  const html = createHtmlConfig(normalizedConfig, appContext);
  const output = createOutputConfig(normalizedConfig, appContext);
  const tools = createToolsConfig(normalizedConfig);

  return {
    source,
    html,
    output,
    tools,
    performance: {
      // `@modern-js/webpack` used to remove moment locale by default
      removeMomentLocale: true,
    },
  };
}

export function createBuilderOptions(
  target: BuilderTarget | BuilderTarget[],
  appContext: IAppContext,
): CreateBuilderOptions {
  // create entries
  type Entries = Record<string, string[]>;
  const entries: Entries = {};
  const { entrypoints = [], checkedEntries } = appContext;
  for (const { entryName, entry } of entrypoints) {
    if (checkedEntries && !checkedEntries.includes(entryName)) {
      continue;
    }

    if (entryName in entries) {
      entries[entryName].push(entry);
    } else {
      entries[entryName] = [entry];
    }
  }

  return {
    cwd: appContext.appDirectory,
    target,
    configPath: appContext.configFile || undefined,
    entry: entries,
    framework: appContext.metaName,
  };
}

/**
 * register builder Plugin by condition
 */
async function applyBuilderPlugins(
  builder: BuilderInstance,
  normalizedConfig: NormalizedConfig,
  appContext: IAppContext,
  compatPluginConfig?: PluginCompatModernOptions,
) {
  if (!normalizedConfig.output.disableNodePolyfill) {
    const { PluginNodePolyfill } = await import(
      '@modern-js/builder-plugin-node-polyfill'
    );
    builder.addPlugins([PluginNodePolyfill()]);
  }

  if (normalizedConfig.tools.esbuild) {
    const { esbuild: esbuildOptions } = normalizedConfig.tools;
    const { PluginEsbuild } = await import('@modern-js/builder-plugin-esbuild');
    builder.addPlugins([
      PluginEsbuild({
        loader: false,
        minimize: applyOptionsChain({}, esbuildOptions),
      }),
    ]);
  }

  builder.addPlugins([
    PluginCompatModern(appContext, normalizedConfig, compatPluginConfig),
  ]);
}
