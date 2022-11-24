import {
  BuilderInstance,
  BuilderTarget,
  createBuilder,
  CreateBuilderOptions,
} from '@modern-js/builder';
import { builderWebpackProvider } from '@modern-js/builder-webpack-provider';
import type { IAppContext, CliNormalizedConfig } from '@modern-js/core';
import { applyOptionsChain, isUseSSRBundle } from '@modern-js/utils';
import type { AppTools } from '../types';
import {
  PluginCompatModernOptions,
  PluginCompatModern,
} from './builderPlugins/compatModern';

export type BuilderOptions = {
  target?: BuilderTarget | BuilderTarget[];
  normalizedConfig: CliNormalizedConfig<AppTools>;
  appContext: IAppContext;
  compatPluginConfig?: PluginCompatModernOptions;
};

function getBuilderTargets(normalizedConfig: CliNormalizedConfig<AppTools>) {
  const targets: BuilderTarget[] = ['web'];
  if (
    normalizedConfig.output.enableModernMode &&
    !targets.includes('modern-web')
  ) {
    targets.push('modern-web');
  }

  if (isUseSSRBundle(normalizedConfig)) {
    targets.push('node');
  }

  return targets;
}

export async function createBuilderForEdenX({
  normalizedConfig,
  appContext,
  compatPluginConfig,
}: BuilderOptions) {
  // create webpack provider
  const webpackProvider = builderWebpackProvider({
    builderConfig: normalizedConfig,
  });

  const target = getBuilderTargets(normalizedConfig);
  const builderOptions = createBuilderOptions(target, appContext);
  const builder = await createBuilder(webpackProvider, builderOptions);

  await applyBuilderPlugins(
    builder,
    normalizedConfig,
    appContext,
    compatPluginConfig,
  );

  return builder;
}

// function createBuilderProviderConfig(
//   normalizedConfig: CliNormalizedConfig<LegacyAppTools>,
//   appContext: IAppContext,
// ): BuilderConfig {
//   const source = createSourceConfig(normalizedConfig, appContext);
//   const html = createHtmlConfig(normalizedConfig, appContext);
//   const output = createOutputConfig(normalizedConfig, appContext);
//   const tools = createToolsConfig(normalizedConfig);

//   return {
//     source,
//     html,
//     output,
//     tools,
//     dev: {
//       https: normalizedConfig.dev.https,
//       assetPrefix: normalizedConfig.dev.assetPrefix,
//     },
//     performance: {
//       // `@modern-js/webpack` used to remove moment locale by default
//       removeMomentLocale: true,
//     },
//   };
// }

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
  normalizedConfig: CliNormalizedConfig<AppTools>,
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
        minimize: applyOptionsChain<any, any>({}, esbuildOptions),
      }),
    ]);
  }

  builder.addPlugins([
    PluginCompatModern(appContext, normalizedConfig, compatPluginConfig),
  ]);
}
