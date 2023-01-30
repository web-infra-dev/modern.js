import { sharedSecurityConfigSchema, z } from '@modern-js/builder-shared';
import type { SecurityConfig } from '../../types';

export const securityConfigSchema: z.ZodType<SecurityConfig> =
  sharedSecurityConfigSchema
    .extend({
      checkSyntax: z.union([
        z.boolean(),
        z.object({
          targets: z.array(z.string()),
        }),
      ]),
    })
    .partial();
