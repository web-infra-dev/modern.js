import { createAsyncWorkflow } from '@modern-js/plugin';
import type { DagOperator } from '../dag/operator';

const afterMonorepoDeploy = createAsyncWorkflow<
  {
    operator: DagOperator;
    deployProjectNames: string[];
  },
  void
>();

export const hooks = {
  afterMonorepoDeploy,
};
