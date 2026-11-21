import { getResourceStageScheduler } from './scheduler';
import { getBundleId } from './bridge';

/**
 * Start the scheduler with the runtime. Only called when
 * `performance.resourceStages` is configured; applications that only declare
 * with `stagedImport` start it with their first declaration.
 */
export const startResourceStages = () => {
  getResourceStageScheduler(getBundleId());
};
