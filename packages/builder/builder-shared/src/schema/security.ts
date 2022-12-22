import { SharedSecurityConfig, SriOptions } from '../types';
import { z } from '../utils';
import { ZodType } from '../zod';

export const SriOptionsSchema: ZodType<SriOptions> = z.partialObj({
  hashFuncNames: z.array(z.string()).min(1) as unknown as ZodType<
    [string, ...string[]]
  >,
  enabled: z.literals<SriOptions['enabled']>(['auto', true, false]),
  hashLoading: z.literals<SriOptions['hashLoading']>(['eager', 'lazy']),
});

export const sharedSecurityConfigSchema: ZodType<SharedSecurityConfig> =
  z.partialObj({
    sri: z.union([SriOptionsSchema, z.boolean()]),
  });
