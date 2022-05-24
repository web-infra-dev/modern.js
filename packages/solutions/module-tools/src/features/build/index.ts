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
const buildBundleFeature: typeof import('./bundle') = Import.lazy(
  './bundle',
  require,
);

const bp: typeof import('./build-platform') = Import.lazy(
  './build-platform',
  require,
);

const checkPlatformAndRunBuild = async (
  platform: IBuildConfig['platform'],
  options: { api: PluginAPI; isTsProject: boolean },
) => {
  const { api, isTsProject } = options;
  if (typeof platform === 'boolean' && platform) {
    if (process.env.RUN_PLATFORM) {
      await bp.buildPlatform(api, { platform: 'all', isTsProject });
    }
    return { exit: true };
  }

  if (typeof platform === 'string') {
    if (process.env.RUN_PLATFORM) {
      await bp.buildPlatform(api, { platform, isTsProject });
    }
    return { exit: true };
  }

  return { exit: false };
};

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

  const platformBuildRet = await checkPlatformAndRunBuild(platform, {
    api,
    isTsProject,
  });
  if (platformBuildRet.exit) {
    return;
  }

  if (clear) {
    fs.removeSync(path.join(appDirectory, outputPath));
  }

  // should normalize module tool config here, ensure the same config for build
  // TODO: merge cli and module config
  const normalizedModuleConfig = normalizeModuleConfig(
    modernConfig.buildPreset,
  );
  Promise.all(
    normalizedModuleConfig.map(moduleConfig => {
      if (moduleConfig.bundle) {
        return buildBundleFeature.buildInBundleMode({
          ...config,
          ...moduleConfig,
        });
      } else if (enableWatchMode) {
        return buildWatchFeature.buildInWatchMode(api, config, modernConfig);
      } else {
        return buildFeature.buildSourceCode(api, config, modernConfig);
      }
    }),
  );
};
