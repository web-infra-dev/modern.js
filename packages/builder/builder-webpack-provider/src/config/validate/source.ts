import { sharedSourceConfigSchema, z } from '@modern-js/builder-shared';
import type { SourceConfig } from '../../types';

export const sourceConfigSchema: z.ZodType<SourceConfig> =
  sharedSourceConfigSchema
    .extend({
      define: z.record(z.any()),
      alias: z.chained(z.record(z.arrayOrNot(z.string()))),
      moduleScopes: z.chained(
        z.array(z.union([z.string(), z.instanceof(RegExp)])),
      ),
    })
    .partial();
