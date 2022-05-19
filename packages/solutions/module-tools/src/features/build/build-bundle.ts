import { runSpeedy } from './runSpeedy';
import { startRollup } from './runRollup';
import type { TaskBuildConfig } from '../../types';


export const buildInBundleMode = async (config: TaskBuildConfig) => {
  Promise.all([startRollup(config), runSpeedy(config)]);
};


