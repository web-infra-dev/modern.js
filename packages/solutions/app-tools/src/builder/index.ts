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
  compatMode?: boolean;
};

function getBuilderTargets(normalizedConfig: AppNormalizedConfig) {
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
  compatMode,
}: BuilderOptions) {
  // create webpack provider
  const builderConfig = createBuilderProviderConfig(
    normalizedConfig,
    appContext,
    Boolean(compatMode),
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
  compatMode: boolean,
): BuilderConfig {
  const output = createOutputConfig(normalizedConfig, appContext, compatMode);
  return {
    ...normalizedConfig,
    source: {
      ...normalizedConfig.source,
      resolveExtensionPrefix: '.web',
    },
    output,
    dev: {
      https: normalizedConfig.dev.https,
      assetPrefix: normalizedConfig.dev.assetPrefix,
    },
    html: {
      ...normalizedConfig.html,
      templateByEntries:
        normalizedConfig.html.templateByEntries || appContext.htmlTemplates,
    },
    performance: {
      ...normalizedConfig.performance,
      // `@modern-js/webpack` used to remove moment locale by default
      removeMomentLocale: true,
    },
  };

  function createOutputConfig(
    config: AppNormalizedConfig,
    appContext: IAppContext,
    compatMode: boolean,
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
      // `@modern-js/webpack` used to generate asset manifest by default
      enableAssetManifest: true,
      // compatible the modern-js with fallback behavior
      enableAssetFallback: compatMode,
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
