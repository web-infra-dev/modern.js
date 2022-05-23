import { runSpeedy } from './runSpeedy';
import { startRollup } from './runRollup';
import type { BundleBuildConfig } from './type';


export const buildInBundleMode = async (config: BundleBuildConfig) => {
  Promise.all([startRollup(config), runSpeedy(config)]);
};


