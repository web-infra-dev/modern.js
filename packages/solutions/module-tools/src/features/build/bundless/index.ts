import { PluginAPI } from '@modern-js/core';
import type { NormalizedBundlessBuildConfig } from '../types';
import { runBabelBuild } from './runBabel';
import { buildStyle } from './style';
import { genDts } from './generator-dts';
import { copyStaticAssets } from './copy-assets';

export const build = async (
  api: PluginAPI,
  config: NormalizedBundlessBuildConfig,
) => {
  await Promise.all([
    runBabelBuild(api, config),
    genDts(api, config),
    buildStyle(api, config),
    copyStaticAssets(api, config),
  ]);
};
