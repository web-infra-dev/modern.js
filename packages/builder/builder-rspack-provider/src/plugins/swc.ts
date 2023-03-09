import * as path from 'path';

import {
  BuilderTarget,
  getBrowserslistWithDefault,
  logger,
  mergeBuilderConfig,
  setConfig,
} from '@modern-js/builder-shared';
import type {
  BuilderPlugin,
  BuilderPluginAPI,
  NormalizedConfig,
  RspackConfig,
} from '../types';

/**
 * Provide some swc configs of rspack
 */
export const builderPluginSwc = (): BuilderPlugin => ({
  name: 'builder-plugin-swc',

  setup(api) {
    const getPolyfillEntry = () => {
      return path.resolve(api.context.cachePath, 'polyfill.js');
    };

    api.onBeforeCreateCompiler(async () => {
      const config = api.getNormalizedConfig();
      if (
        isWebTarget(api.context.target) &&
        config.output.polyfill === 'entry'
      ) {
        const fs = await import('@modern-js/utils/fs-extra');
        fs.ensureFileSync(getPolyfillEntry());
        fs.writeFileSync(getPolyfillEntry(), "import 'core-js'");
      }
    });

    api.modifyBuilderConfig(config => {
      const mode = config?.output?.polyfill ?? 'entry';
      if (isWebTarget(api.context.target) && mode === 'entry') {
        return mergeBuilderConfig(config, {
          source: { preEntry: getPolyfillEntry() },
        });
      }

      return config;
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
  /**
   * Swc only enable latestDecorator for JS module, not TS module.
   */
  setConfig(rspackConfig, 'builtins.decorator', {
    legacy: !builderConfig.output.enableLatestDecorators,
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

    // TODO: remove this when rspack support `usage` mode
    if (polyfillMode === 'usage') {
      logger.warn(
        'Cannot use `usage` mode polyfill for now, rspack will support it soon',
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

function isWebTarget(target: BuilderTarget | BuilderTarget[]): boolean {
  return ['modern-web', 'web'].some(t =>
    (Array.isArray(target) ? target : [target]).includes(t as BuilderTarget),
  );
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
