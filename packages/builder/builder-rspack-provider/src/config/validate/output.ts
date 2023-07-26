import { sharedOutputConfigSchema, z } from '@modern-js/builder-shared';
import type { OutputConfig } from '../../types';

export const outputConfigSchema: z.ZodType<OutputConfig> =
  sharedOutputConfigSchema
    .extend({
      legalComments: z.enum(['none', 'linked']),
      polyfill: z.enum(['entry', 'ua', 'off']),
    })
    .partial();
