import { sharedExperimentsConfigSchema, z } from '@modern-js/builder-shared';
import type { ExperimentsConfig } from '../../types';

export const experimentsConfigSchema: z.ZodType<ExperimentsConfig> =
  sharedExperimentsConfigSchema
    .extend({
      sourceBuild: z.boolean(),
    })
    .partial();
