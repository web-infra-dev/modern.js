import {
  BuilderTarget,
  createBuilder,
  CreateBuilderOptions,
} from '@modern-js/builder';
import {
  BuilderConfig,
  builderWebpackProvider,
} from '@modern-js/builder-webpack-provider';
import type { IAppContext, NormalizedConfig } from '@modern-js/core';
import { applyOptionsChain, ensureArray } from '@modern-js/utils';
import { createHtmlConfig } from './createHtmlConfig';
import { createOutputConfig } from './createOutputConfig';
import { createSourceConfig } from './createSourceConfig';
import { createToolsConfig } from './createToolsConfig';

export default async ({
  target = 'web',
  normalizedConfig,
  appContext,
}: {
  target?: BuilderTarget | BuilderTarget[];
  normalizedConfig: NormalizedConfig;
  appContext: IAppContext;
}) => {
  const targets = Array.isArray(target) ? target : [target];
  if (
    normalizedConfig.output.enableModernMode &&
    !targets.includes('modern-web')
  ) {
    targets.push('modern-web');
  }

  const builderConfig = createBuilderProviderConfig(
    targets,
    normalizedConfig,
    appContext,
  );
  const provider = builderWebpackProvider({ builderConfig });

  const builderOptions = createBuilderOptions(
    target,
    normalizedConfig,
    appContext,
  );
  const builder = await createBuilder(provider, builderOptions);

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

  return builder;
};

function createBuilderProviderConfig(
  _target: BuilderTarget | BuilderTarget[],
  normalizedConfig: NormalizedConfig,
  appContext: IAppContext,
): BuilderConfig {
  const source = createSourceConfig(normalizedConfig, appContext);
  const html = createHtmlConfig(normalizedConfig);
  const output = createOutputConfig(normalizedConfig);
  const tools = createToolsConfig(normalizedConfig);

  return {
    source,
    html,
    output,
    tools,
  };
}

function createBuilderOptions(
  target: BuilderTarget | BuilderTarget[],
  normalizedConfig: NormalizedConfig,
  appContext: IAppContext,
): CreateBuilderOptions {
  const builderEntry: {
    [entryName: string]: string[];
  } = {};
  const { entrypoints = [], checkedEntries } = appContext;
  const { preEntry } = normalizedConfig.source;
  const preEntries = preEntry ? ensureArray(preEntry) : [];
  for (const { entryName, entry } of entrypoints) {
    if (checkedEntries && !checkedEntries.includes(entryName)) {
      continue;
    }

    preEntries.forEach(entry => {
      if (entryName in builderEntry) {
        builderEntry[entryName].push(entry);
      } else {
        builderEntry[entryName] = [entry];
      }
    });

    if (entryName in builderEntry) {
      builderEntry[entryName].push(entry);
    } else {
      builderEntry[entryName] = [entry];
    }
  }

  return {
    target,
    configPath: '',
    entry: builderEntry,
  };
}
