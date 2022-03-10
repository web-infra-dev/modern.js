import { registerHook } from '@modern-js/core';
import { createAsyncWorkflow } from '@modern-js/plugin';
import type { DagOperator } from '../dag/operator';

const afterMonorepoDeploy = createAsyncWorkflow<
  {
    operator: DagOperator;
    deployProjectNames: string[];
  },
  // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
  void
>();

export const lifecycle = () => {
  registerHook({
    afterMonorepoDeploy,
  });
};
