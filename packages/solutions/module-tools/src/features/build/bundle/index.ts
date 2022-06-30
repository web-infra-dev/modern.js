import type { PluginAPI } from '@modern-js/core';
import pMap from 'p-map';
import type { NormalizedBundleBuildConfig } from '../types';
import { runSpeedy } from './runSpeedy';
import { startRollup } from './runRollup';

export const build = async (
  api: PluginAPI,
  config: NormalizedBundleBuildConfig,
) => {
  const tasks = config.dtsOnly ? [startRollup] : [runSpeedy, startRollup];
  await pMap(tasks, async task => {
    await task(api, config);
  });
};
