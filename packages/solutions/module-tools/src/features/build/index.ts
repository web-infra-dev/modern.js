import path from 'path';
import { Import, fs } from '@modern-js/utils';
import type { PluginAPI } from '@modern-js/core';
import type { IBuildFeatOption } from '../../types';
import type {
  NormalizedBundleBuildConfig,
  NormalizedBundlessBuildConfig,
} from './types';
import { normalizeModuleConfig } from './normalize';

const bundle: typeof import('./bundle') = Import.lazy('./bundle', require);

const bundless: typeof import('./bundless') = Import.lazy(
  './bundless',
  require,
);

const bp: typeof import('./build-platform') = Import.lazy(
  './build-platform',
  require,
);

const checkPlatformAndRunBuild = async (
  platform: IBuildFeatOption['platform'],
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

export const build = async (api: PluginAPI, config: IBuildFeatOption) => {
  const { platform, clear = true, isTsProject } = config;
  const { appDirectory } = api.useAppContext();
  const modernConfig = api.useResolvedConfigContext();
  const {
    output: { path: outputPath = 'dist', buildPreset },
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
  const normalizedModuleConfig = normalizeModuleConfig(
    { buildFeatOption: config, api },
    buildPreset,
  );

  Promise.all(
    normalizedModuleConfig.map(moduleConfig => {
      if (moduleConfig.bundle) {
        return bundle.build(api, {
          ...config,
          ...moduleConfig,
        } as NormalizedBundleBuildConfig);
      } else {
        return bundless.build(api, {
          ...config,
          ...moduleConfig,
        } as NormalizedBundlessBuildConfig);
      }
    }),
  );
};
