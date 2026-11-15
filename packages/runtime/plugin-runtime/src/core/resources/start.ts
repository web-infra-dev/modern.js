import { getResourceStageScheduler } from './scheduler';

/**
 * Start the scheduler with the runtime. Only called when
 * `performance.resourceStages` is configured; applications that only declare
 * with `stagedImport` start it with their first declaration.
 */
export const startResourceStages = () => {
  getResourceStageScheduler();
};
