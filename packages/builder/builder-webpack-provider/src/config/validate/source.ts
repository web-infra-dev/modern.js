import { sharedSourceConfigSchema, z } from '@modern-js/builder-shared';
import type { SourceConfig } from '../../types';

export const sourceConfigSchema: z.ZodType<SourceConfig> =
  sharedSourceConfigSchema
    .extend({
      moduleScopes: z.chained(
        z.array(z.union([z.string(), z.instanceof(RegExp)])),
      ),
    })
    .partial();
