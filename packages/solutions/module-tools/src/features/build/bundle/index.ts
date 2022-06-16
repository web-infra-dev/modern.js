import { PluginAPI } from '@modern-js/core';
import type { NormalizedBundleBuildConfig } from '../types';
import { runSpeedy } from './runSpeedy';
import { startRollup } from './runRollup';

export const build = async (
  api: PluginAPI,
  config: NormalizedBundleBuildConfig,
) => {
  const tasks = config.dtsOnly
    ? [startRollup(api, config)]
    : [runSpeedy(api, config), startRollup(api, config)];
  await Promise.all(tasks);
};
