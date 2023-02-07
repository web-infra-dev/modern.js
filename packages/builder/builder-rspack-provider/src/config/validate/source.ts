import { sharedSourceConfigSchema, z } from '@modern-js/builder-shared';
import type { SourceConfig } from '../../types';

export const sourceConfigSchema: z.ZodType<SourceConfig> =
  sharedSourceConfigSchema
    .extend({
      alias: z.chained(z.record(z.string())),
      define: z.record(z.string()),
    })
    .partial();
