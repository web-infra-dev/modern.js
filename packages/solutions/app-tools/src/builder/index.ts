import {
  BuilderInstance,
  BuilderTarget,
  createBuilder,
  CreateBuilderOptions,
} from '@modern-js/builder';
import {
  BuilderConfig,
  BuilderWebpackProvider,
  builderWebpackProvider,
} from '@modern-js/builder-webpack-provider';
import type { IAppContext } from '@modern-js/core';
import { applyOptionsChain, isUseSSRBundle } from '@modern-js/utils';
import type { AppNormalizedConfig } from '../types';
import {
  PluginCompatModernOptions,
  PluginCompatModern,
} from './builderPlugins/compatModern';
import { createCopyPattern } from './share';

export type BuilderOptions = {
  target?: BuilderTarget | BuilderTarget[];
  normalizedConfig: AppNormalizedConfig;
  appContext: IAppContext;
  compatPluginConfig?: PluginCompatModernOptions;
};

function getBuilderTargets(normalizedConfig: AppNormalizedConfig) {
  const targets: BuilderTarget[] = ['web'];

  if (isUseSSRBundle(normalizedConfig)) {
    targets.push('node');
  }

  return targets;
}

export async function createBuilderForModern({
  normalizedConfig,
  appContext,
  compatPluginConfig,
}: BuilderOptions): Promise<BuilderInstance<BuilderWebpackProvider>> {
  // create webpack provider
  const builderConfig = createBuilderProviderConfig(
    normalizedConfig,
    appContext,
  );
  const webpackProvider = builderWebpackProvider({
    builderConfig,
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

export function createBuilderProviderConfig(
  normalizedConfig: AppNormalizedConfig,
  appContext: IAppContext,
): BuilderConfig {
  const output = createOutputConfig(normalizedConfig, appContext);

  const htmlConfig = { ...normalizedConfig.html };

  // Priority: templateByEntries > template > appContext.htmlTemplates
  if (!htmlConfig.template) {
    htmlConfig.templateByEntries = {
      ...htmlConfig.templateByEntries,
      ...appContext.htmlTemplates,
    };
  }

  return {
    ...normalizedConfig,
    source: {
      ...normalizedConfig.source,
      resolveExtensionPrefix: '.web',
    },
    output,
    dev: {
      port: normalizedConfig.server?.port,
      https: normalizedConfig.dev.https,
      assetPrefix: normalizedConfig.dev.assetPrefix,
    },
    html: htmlConfig,
    performance: {
      ...normalizedConfig.performance,
      // modern.js v1 used to remove moment locale by default
      removeMomentLocale: true,
    },
  };

  function createOutputConfig(
    config: AppNormalizedConfig,
    appContext: IAppContext,
  ) {
    const defaultCopyPattern = createCopyPattern(appContext, config, 'upload');
    const { copy } = config.output;
    const copyOptions = Array.isArray(copy) ? copy : copy?.patterns;
    const builderCopy = [...(copyOptions || []), defaultCopyPattern];
    return {
      ...config.output,
      copy: builderCopy,
      // We need to do this in the app-tools prepare hook because some files will be generated into the dist directory in the analyze process
      cleanDistPath: false,
    };
  }
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
  normalizedConfig: AppNormalizedConfig,
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
