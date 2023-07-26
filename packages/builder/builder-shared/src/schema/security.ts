import { SharedSecurityConfig, SriOptions } from '../types';
import { z } from '../utils';
import { ZodType } from '../zod';

export const SriOptionsSchema: ZodType<SriOptions> = z.partialObj({
  hashFuncNames: z.array(z.string()).min(1) as unknown as ZodType<
    [string, ...string[]]
  >,
  enabled: z.literals(['auto', true, false]),
  hashLoading: z.enum(['eager', 'lazy']),
});

export const sharedSecurityConfigSchema = z.partialObj({
  nonce: z.string(),
  checkSyntax: z.union([
    z.boolean(),
    z.object({
      targets: z.optional(z.array(z.string())),
      exclude: z.optional(
        z.union([z.instanceof(RegExp), z.array(z.instanceof(RegExp))]),
      ),
      ecmaVersion: z.optional(
        z.literals([
          3,
          5,
          6,
          7,
          8,
          9,
          10,
          11,
          12,
          13,
          2015,
          2016,
          2017,
          2018,
          2019,
          2020,
          2021,
          2022,
          'latest',
        ]),
      ),
    }),
  ]),
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _schema: z.ZodType<SharedSecurityConfig> = sharedSecurityConfigSchema;
