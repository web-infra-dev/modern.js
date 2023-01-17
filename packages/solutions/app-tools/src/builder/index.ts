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
import {
  applyOptionsChain,
  isProd,
  isSSR,
  isUseSSRBundle,
} from '@modern-js/utils';
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

  const useNodeTarget = isProd()
    ? isUseSSRBundle(normalizedConfig)
    : isSSR(normalizedConfig);

  if (useNodeTarget) {
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
    output,
    dev: {
      ...normalizedConfig.dev,
      port: appContext.port,
    },
    html: htmlConfig,
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
    const { builderPluginNodePolyfill } = await import(
      '@modern-js/builder-plugin-node-polyfill'
    );
    builder.addPlugins([builderPluginNodePolyfill()]);
  }

  if (normalizedConfig.tools.esbuild) {
    const { esbuild: esbuildOptions } = normalizedConfig.tools;
    const { builderPluginEsbuild } = await import(
      '@modern-js/builder-plugin-esbuild'
    );
    builder.addPlugins([
      builderPluginEsbuild({
        loader: false,
        minimize: applyOptionsChain<any, any>({}, esbuildOptions),
      }),
    ]);
  }

  builder.addPlugins([
    PluginCompatModern(appContext, normalizedConfig, compatPluginConfig),
  ]);
}
