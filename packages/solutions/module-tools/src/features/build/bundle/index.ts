import { PluginAPI } from '@modern-js/core';
import type { TaskBuildConfig } from '../types';
import { runSpeedy } from './runSpeedy';
import { startRollup } from './runRollup';

export const build = async (api: PluginAPI, config: TaskBuildConfig) => {
  Promise.all([startRollup(api, config), runSpeedy(api, config)]);
};
