import { Schema } from '@modern-js/codesmith-formily';
import { getBaseSchema } from './base';
import { Solution } from './common';
import { ModuleDefaultConfig, getModuleSchema } from './module';
import { MWADefaultConfig, getMWASchema } from './mwa';

export * from './locale';
export * from './common';
export * from './newAction';
export * from './mwa';
export * from './module';
export * from './expand';
export * from './base';

export const SolutionDefaultConfig: Record<Solution, Record<string, string>> = {
  [Solution.MWA]: MWADefaultConfig,
  [Solution.Module]: ModuleDefaultConfig,
};

export const SolutionSchemas: Record<
  Solution | 'custom',
  (extra?: Record<string, string>) => Schema
> = {
  [Solution.MWA]: getMWASchema,
  [Solution.Module]: getModuleSchema,
  custom: getBaseSchema,
};
