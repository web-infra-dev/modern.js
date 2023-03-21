import { sharedSecurityConfigSchema, z } from '@modern-js/builder-shared';
import type { SecurityConfig } from '../../types';

export const securityConfigSchema: z.ZodType<SecurityConfig> =
  sharedSecurityConfigSchema
    .extend({
      checkSyntax: z.union([
        z.boolean(),
        z.object({
          targets: z.array(z.string()),
          exclude: z.optional(
            z.union([z.instanceof(RegExp), z.array(z.instanceof(RegExp))]),
          ),
        }),
      ]),
    })
    .partial();
