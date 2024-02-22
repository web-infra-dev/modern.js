import * as path from 'path';

import {
  BuilderTarget,
  getBrowserslistWithDefault,
  logger,
  setConfig,
  isWebTarget,
  addCoreJsEntry,
} from '@modern-js/builder-shared';
import type {
  BuilderPlugin,
  BuilderPluginAPI,
  NormalizedConfig,
  RspackConfig,
} from '../types';
import { Builtins } from '@rspack/core';

/**
 * Provide some swc configs of rspack
 */
export const builderPluginSwc = (): BuilderPlugin => ({
  name: 'builder-plugin-swc-rspack',

  setup(api) {
    api.modifyBundlerChain(async (chain, { isServer, isServiceWorker }) => {
      const config = api.getNormalizedConfig();

      addCoreJsEntry({
        chain,
        config,
        isServer,
        isServiceWorker,
      });
    });

    api.modifyRspackConfig(async (rspackConfig, { target }) => {
      const builderConfig = api.getNormalizedConfig();

      // Apply decorator and presetEnv
      await applyDefaultConfig(rspackConfig, builderConfig, api, target);
    });
  },
});

async function applyDefaultConfig(
  rspackConfig: RspackConfig,
  builderConfig: NormalizedConfig,
  api: BuilderPluginAPI,
  target: BuilderTarget,
) {
  const legacy = !builderConfig.output.enableLatestDecorators;
  /**
   * Swc only enable latestDecorator for JS module, not TS module.
   */
  setConfig(rspackConfig, 'builtins.decorator', {
    legacy,
    emitMetadata: legacy,
  });

  rspackConfig.builtins ??= {};
  rspackConfig.builtins.presetEnv ??= {};

  await setBrowserslist(
    api.context.rootPath,
    builderConfig,
    target,
    rspackConfig,
  );

  /**
   * Enable preset-env polyfill: set rspackConfig.target === 'browserslist'
   */
  if (isWebTarget(target)) {
    const polyfillMode = builderConfig.output.polyfill;

    // TODO: remove this when Rspack support `usage` mode
    if (polyfillMode === 'usage') {
      logger.warn(
        'Cannot use `usage` mode polyfill for now, Rspack will support it soon',
      );
      rspackConfig.builtins.presetEnv.mode = undefined;
      return;
    }

    if (polyfillMode === 'off' || polyfillMode === 'ua') {
      rspackConfig.builtins.presetEnv.mode = undefined;
    } else {
      rspackConfig.builtins.presetEnv.mode = polyfillMode;
      /* Apply core-js version and path alias */
      await applyCoreJs(rspackConfig);
    }
  }

  applyTransformImport(rspackConfig, builderConfig.source.transformImport);
}

async function setBrowserslist(
  rootPath: string,
  builderConfig: NormalizedConfig,
  target: BuilderTarget,
  rspackConfig: RspackConfig,
) {
  const browserslist = await getBrowserslistWithDefault(
    rootPath,
    builderConfig,
    target,
  );

  if (browserslist) {
    rspackConfig.builtins!.presetEnv!.targets = browserslist;
  }
}

async function applyCoreJs(rspackConfig: RspackConfig) {
  const { getCoreJsVersion } = await import('@modern-js/utils');
  const coreJsPath = require.resolve('core-js/package.json');
  const version = getCoreJsVersion(coreJsPath);

  rspackConfig.builtins!.presetEnv!.coreJs = version;

  rspackConfig.resolve ??= {};
  rspackConfig.resolve.alias ??= {};
  rspackConfig.resolve.alias['core-js'] = path.dirname(coreJsPath);
}

async function applyTransformImport(
  rspackConfig: RspackConfig,
  pluginImport?: false | Builtins['pluginImport'],
) {
  if (pluginImport !== false && pluginImport) {
    ensureNoJsFunction(pluginImport);
    rspackConfig.builtins ??= {};
    rspackConfig.builtins.pluginImport ??= [];
    rspackConfig.builtins.pluginImport.push(...pluginImport);
  }
}

function ensureNoJsFunction(pluginImport: Array<Record<string, any>>) {
  for (const item of pluginImport) {
    for (const key in item) {
      if (typeof item[key] === 'function') {
        throw new TypeError(
          '`builtins.pluginImport` can not contain Function configuration',
        );
      }
    }
  }
}