import path from 'path';
import { Import, fs, chalk } from '@modern-js/utils';
import type { PluginAPI } from '@modern-js/core';
import pMap from 'p-map';
import type { IBuildFeatOption } from '../../types';
import { ReadlineUtils } from '../../utils/readline';
import { normalizeModuleConfig } from './normalize';
import { buildingText, buildSuccessText } from './constants';
import { ModuleBuildError, isInternalError } from './error';
import { getAllDeps } from './utils';
import type { NormalizedBuildConfig } from './types';

const bundle: typeof import('./bundle') = Import.lazy('./bundle', require);
const bundleless: typeof import('./bundleless') = Import.lazy(
  './bundleless',
  require,
);

const bp: typeof import('./build-platform') = Import.lazy(
  './build-platform',
  require,
);

export const checkPlatformAndRunBuild = async (
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

export const runBuild = async (
  api: PluginAPI,
  normalizedModuleConfig: NormalizedBuildConfig[],
  config: IBuildFeatOption,
) => {
  await pMap(normalizedModuleConfig, async moduleConfig => {
    if (moduleConfig.buildType === 'bundle') {
      await bundle.build(api, moduleConfig);
    } else {
      await bundleless.build(api, moduleConfig, config);
    }
  });
};

export const buildInNormalMode = async (
  api: PluginAPI,
  normalizedModuleConfig: NormalizedBuildConfig[],
  config: IBuildFeatOption,
) => {
  console.info(chalk.blue.bold(buildingText));
  try {
    // eslint-disable-next-line no-console
    console.time(buildSuccessText);

    await runBuild(api, normalizedModuleConfig, config);

    ReadlineUtils.clearPrevLine(process.stdout);
    // eslint-disable-next-line no-console
    console.timeEnd(buildSuccessText);
  } catch (e) {
    ReadlineUtils.clearPrevLine(process.stdout);
    if (isInternalError(e)) {
      throw new ModuleBuildError(e);
    } else {
      throw e;
    }
  }
};

export const build = async (api: PluginAPI, config: IBuildFeatOption) => {
  const { platform, clear = true, isTsProject } = config;
  const { appDirectory } = api.useAppContext();
  const modernConfig = api.useResolvedConfigContext();
  const {
    output: { path: outputPath = 'dist' },
  } = modernConfig;

  // build platform
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

  const deps = getAllDeps(appDirectory);

  // should normalize module tool config here, ensure the same config for build
  const normalizedModuleConfig = normalizeModuleConfig({
    buildFeatOption: config,
    api,
    deps,
  });

  if (config.enableWatchMode) {
    console.info(chalk.blue.underline('start build in watch mode...\n'));
    await runBuild(api, normalizedModuleConfig, config);
  } else {
    await buildInNormalMode(api, normalizedModuleConfig, config);
  }
};
