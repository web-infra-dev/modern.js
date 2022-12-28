import { SharedSecurityConfig, SriOptions } from '../types';
import { z } from '../utils';
import { ZodType } from '../zod';

export const SriOptionsSchema: ZodType<SriOptions> = z.partialObj({
  hashFuncNames: z.array(z.string()).min(1) as unknown as ZodType<
    [string, ...string[]]
  >,
  enabled: z.literals(['auto', true, false]),
  hashLoading: z.literals(['eager', 'lazy']),
});

export const sharedSecurityConfigSchema = z.partialObj({
  sri: z.union([SriOptionsSchema, z.boolean()]),
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _schema: z.ZodType<SharedSecurityConfig> = sharedSecurityConfigSchema;
