import { sharedOutputConfigSchema, z } from '@modern-js/builder-shared';
import type { OutputConfig } from '../../types';

export const outputConfigSchema: z.ZodType<OutputConfig> =
  sharedOutputConfigSchema
    .extend({
      convertToRem: z.union([z.boolean(), z.instanceof(Object)]),
      externals: z.record(z.string()),
    })
    .partial();
