import path from 'path';
import { Import, fs } from '@modern-js/utils';
import type { NormalizedConfig, PluginAPI } from '@modern-js/core';
import type { IBuildConfig } from '../../types';
import { normalizeModuleConfig } from './utils';

const buildFeature: typeof import('./build') = Import.lazy('./build', require);
const buildWatchFeature: typeof import('./build-watch') = Import.lazy(
  './build-watch',
  require,
);
const buildBundleFeature: typeof import('./build-bundle') = Import.lazy(
  './build-bundle',
  require,
);

const bp: typeof import('./build-platform') = Import.lazy(
  './build-platform',
  require,
);

export const build = async (
  api: PluginAPI,
  config: IBuildConfig,
  modernConfig: NormalizedConfig,
) => {
  const {
    appDirectory,
    enableWatchMode,
    platform,
    clear = true,
    isTsProject,
  } = config;
  const {
    output: { path: outputPath = 'dist' },
  } = modernConfig;

  // TODO: maybe need watch mode in build platform
  if (typeof platform === 'boolean' && platform) {
    if (process.env.RUN_PLATFORM) {
      await bp.buildPlatform(api, { platform: 'all', isTsProject });
    }
    return;
  }

  if (typeof platform === 'string') {
    if (process.env.RUN_PLATFORM) {
      await bp.buildPlatform(api, { platform, isTsProject });
    }
    return;
  }

  if (clear) {
    fs.removeSync(path.join(appDirectory, outputPath));
  }

  // should normalize module tool config here, ensure the same config for build
  //TODO: merge cli and module config
  const normalizedModuleConfig = normalizeModuleConfig(modernConfig.buildPreset);
  Promise.all(normalizedModuleConfig.map(async moduleConfig => {
    if (moduleConfig.bundle) {
      await buildBundleFeature.buildInBundleMode({
        ...config,
        ...moduleConfig,
      });
    }
    else if (enableWatchMode) {
      await buildWatchFeature.buildInWatchMode(api, config, modernConfig);
    } else {
      await buildFeature.buildSourceCode(api, config, modernConfig);
    }
  }));
};
