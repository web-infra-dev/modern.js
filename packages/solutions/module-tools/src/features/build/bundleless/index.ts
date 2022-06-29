import type { PluginAPI } from '@modern-js/core';
import { chalk } from '@modern-js/utils';
import type { NormalizedBundlelessBuildConfig } from '../types';
import type { IBuildFeatOption } from '../../../types';
import { runBabelBuild } from './runBabel';
import { buildStyle } from './style';
import { genDts } from './generator-dts';
import { copyStaticAssets } from './copy-assets';

export const build = async (
  api: PluginAPI,
  config: NormalizedBundlelessBuildConfig,
  legacyOptions?: IBuildFeatOption,
) => {
  // valid format is umd
  if (config.format === 'umd') {
    console.info(chalk.yellowBright('bundleless 构建暂时不支持 umd 格式'));
    return;
  }

  if (legacyOptions?.styleOnly) {
    await buildStyle(api, config);
    return;
  }
  const tasks = config.dtsOnly
    ? [genDts(api, config)]
    : [
        runBabelBuild(api, config),
        genDts(api, config),
        buildStyle(api, config),
        copyStaticAssets(api, config),
      ];
  await Promise.all(tasks);
};
