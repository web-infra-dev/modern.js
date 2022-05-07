import { Schema } from '@modern-js/easy-form-core';
import { BaseSchemas } from './base';
import { Solution } from './common';
import { ModuleDefaultConfig, ModuleSchemas } from './module';
import { MonorepoDefaultConfig, MonorepoSchemas } from './monorepo';
import { MWADefaultConfig, MWASchemas } from './mwa';

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

export const SolutionSchemas: Record<Solution | 'custom', Schema[]> = {
  [Solution.MWA]: MWASchemas,
  [Solution.Module]: ModuleSchemas,
  [Solution.Monorepo]: MonorepoSchemas,
  custom: BaseSchemas,
};
