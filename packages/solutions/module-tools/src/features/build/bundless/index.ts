import { PluginAPI } from '@modern-js/core';
import type { NormalizedBundlessBuildConfig } from '../types';
import { runBabelBuild } from './runBabel';

export const build = async (
  api: PluginAPI,
  config: NormalizedBundlessBuildConfig,
) => {
  await Promise.all([runBabelBuild(api, config)]);
};
