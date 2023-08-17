import { sharedOutputConfigSchema, z } from '@modern-js/builder-shared';
import type { OutputConfig } from '../../types';

export const outputConfigSchema: z.ZodType<OutputConfig> =
  sharedOutputConfigSchema
    .extend({
      polyfill: z.enum(['entry', 'ua', 'off']),
    })
    .partial();
