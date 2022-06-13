import { PluginAPI } from '@modern-js/core';
import type { NormalizedBundlelessBuildConfig } from '../types';
import { runBabelBuild } from './runBabel';
import { buildStyle } from './style';
import { genDts } from './generator-dts';
import { copyStaticAssets } from './copy-assets';

export const build = async (
  api: PluginAPI,
  config: NormalizedBundlelessBuildConfig,
) => {
  await Promise.all([
    runBabelBuild(api, config),
    genDts(api, config),
    buildStyle(api, config),
    copyStaticAssets(api, config),
  ]);
};
