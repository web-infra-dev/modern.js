import {
  sharedSecurityConfigSchema,
  z,
  SriOptions,
} from '@modern-js/builder-shared';
import type { SecurityConfig } from '../../types';

export const SriOptionsSchema: z.ZodType<SriOptions> = z.partialObj({
  hashFuncNames: z.array(z.string()).min(1) as unknown as z.ZodType<
    [string, ...string[]]
  >,
  enabled: z.literals(['auto', true, false]),
  hashLoading: z.enum(['eager', 'lazy']),
});

export const securityConfigSchema: z.ZodType<SecurityConfig> =
  sharedSecurityConfigSchema
    .extend({
      sri: z.union([SriOptionsSchema, z.boolean()]),
    })
    .partial();
