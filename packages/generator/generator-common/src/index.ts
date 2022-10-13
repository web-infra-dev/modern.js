import { Schema } from '@modern-js/codesmith-formily';
import { getBaseSchema } from './base';
import { Solution } from './common';
import { ModuleDefaultConfig, getModuleSchema } from './module';
import { MonorepoDefaultConfig, getMonorepoSchema } from './monorepo';
import { MWADefaultConfig, getMWASchema } from './mwa';

export * from './locale';
export * from './common';
export * from './newAction';
export * from './mwa';
export * from './module';
export * from './monorepo';
export * from './expand';
export * from './base';

export const SolutionDefaultConfig: Record<Solution, Record<string, string>> = {
  [Solution.MWA]: MWADefaultConfig,
  [Solution.Module]: ModuleDefaultConfig,
  [Solution.Monorepo]: MonorepoDefaultConfig,
};

export const SolutionSchemas: Record<
  Solution | 'custom',
  (extra?: Record<string, string>) => Schema
> = {
  [Solution.MWA]: getModuleSchema,
  [Solution.Module]: getMonorepoSchema,
  [Solution.Monorepo]: getMWASchema,
  custom: getBaseSchema,
};
