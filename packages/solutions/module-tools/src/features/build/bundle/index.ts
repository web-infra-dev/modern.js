import type { TaskBuildConfig } from '../../../types';
import { runSpeedy } from './runSpeedy';
import { startRollup } from './runRollup';

export const buildInBundleMode = async (config: TaskBuildConfig) => {
  Promise.all([startRollup(config), runSpeedy(config)]);
};
