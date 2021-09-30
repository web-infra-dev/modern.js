import { Solution } from './common';
import { ModuleDefaultConfig } from './module';
import { MonorepoDefaultConfig } from './monorepo';
import { MWADefaultConfig } from './mwa';

export * from './locale';
export * from './common';
export * from './newAction';
export * from './mwa';
export * from './module';
export * from './monorepo';
export * from './expand';

export const SolutionDefualtConfig: Record<Solution, Record<string, string>> = {
  [Solution.MWA]: MWADefaultConfig,
  [Solution.Module]: ModuleDefaultConfig,
  [Solution.Monorepo]: MonorepoDefaultConfig,
};
