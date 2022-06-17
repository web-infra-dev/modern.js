import path from 'path';
import { Import, fs, logger } from '@modern-js/utils';
import type { PluginAPI } from '@modern-js/core';
import type { IBuildFeatOption } from '../../types';
import { ReadlineUtils } from '../../utils/readline';
import { normalizeModuleConfig } from './normalize';
import { buildingText, buildSuccessText, buildFailText } from './constants';
import { ModuleBuildError, showModuleBuildError } from './error';

const bundle: typeof import('./bundle') = Import.lazy('./bundle', require);
const bundleless: typeof import('./bundleless') = Import.lazy(
  './bundleless',
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
  const normalizedModuleConfig = normalizeModuleConfig({
    buildFeatOption: config,
    api,
  });
  const buildTasks = normalizedModuleConfig.map(moduleConfig => {
    if (moduleConfig.buildType === 'bundle') {
      return bundle.build(api, moduleConfig);
    } else {
      return bundleless.build(api, moduleConfig, config);
    }
  });

  logger.info(buildingText);

  try {
    // eslint-disable-next-line no-console
    console.time(buildSuccessText);
    await Promise.all([...buildTasks]);
    // ReadlineUtils.clearPrevLine(process.stdout);
    // eslint-disable-next-line no-console
    console.timeEnd(buildSuccessText);
  } catch (e) {
    // ReadlineUtils.clearPrevLine(process.stdout);
    if (e instanceof ModuleBuildError) {
      console.info(buildFailText);
      // console.error(e);
      showModuleBuildError(e);
    } else {
      console.info('意外');
      console.error(e);
    }
  }
};
