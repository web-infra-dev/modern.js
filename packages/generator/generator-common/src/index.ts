import { Schema } from '@modern-js/codesmith-formily';
import { getBaseSchema } from './base';
import { Solution } from './common';
import { DocDefaultConfig, getDocSchema } from './doc';
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
export * from './doc';

export const SolutionDefaultConfig: Record<Solution, Record<string, string>> = {
  [Solution.MWA]: MWADefaultConfig,
  [Solution.Module]: ModuleDefaultConfig,
  [Solution.Doc]: DocDefaultConfig,
  [Solution.Monorepo]: MonorepoDefaultConfig,
};

export const SolutionSchemas: Record<
  Solution | 'custom',
  (extra?: Record<string, string>) => Schema
> = {
  [Solution.MWA]: getMWASchema,
  [Solution.Module]: getModuleSchema,
  [Solution.Doc]: getDocSchema,
  [Solution.Monorepo]: getMonorepoSchema,
  custom: getBaseSchema,
};
