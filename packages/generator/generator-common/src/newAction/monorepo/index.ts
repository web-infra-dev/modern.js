import { Schema } from '@modern-js/easy-form-core';
import { SubSolutionSchema, SubSolution } from '../../common';

export const MonorepoNewActionSchema: Schema = {
  key: 'monorepo_new_action',
  isObject: true,
  items: [SubSolutionSchema],
};

export const MonorepoNewActionConfig: Record<
  SubSolution,
  Record<string, unknown>
> = {
  [SubSolution.MWA]: { isMonorepoSubProject: true, isTest: false },
  [SubSolution.MWATest]: { isMonorepoSubProject: true, isTest: true },
  [SubSolution.Module]: { isMonorepoSubProject: true, isPublic: true },
  [SubSolution.InnerModule]: { isMonorepoSubProject: true, isPublic: false },
};
