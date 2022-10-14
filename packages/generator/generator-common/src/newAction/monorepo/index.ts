import { Schema } from '@modern-js/codesmith-formily';
import { getSolutionSchema, SubSolution } from '../../common';

export const getMonorepoNewActionSchema = (
  extra: Record<string, any> = {},
): Schema => {
  return {
    type: 'object',
    properties: {
      solution: getSolutionSchema(extra),
    },
  };
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
