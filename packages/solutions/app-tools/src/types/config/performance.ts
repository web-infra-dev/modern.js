import type { BuilderConfig } from '@modern-js/builder';
import type { ResourceStagesUserConfig } from '../../builder/shared/resourceStages/config';
import type { UnwrapBuilderConfig } from '../utils';

export type { ResourceStagesUserConfig };

export type PerformanceUserConfig = UnwrapBuilderConfig<
  BuilderConfig,
  'performance'
> & {
  /**
   * Download `import()` chunks ahead of time by the stage they are needed in,
   * declared with `stagedImport` from `@modern-js/runtime/resources`.
   */
  resourceStages?: ResourceStagesUserConfig;
};
