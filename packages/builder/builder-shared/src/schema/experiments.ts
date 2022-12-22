import { SharedExperimentsConfig } from '../types';
import { z } from '../utils';
import { ZodType } from '../zod';

export const sharedExperimentsConfigSchema: ZodType<SharedExperimentsConfig> =
  z.partialObj({
    lazyCompilation: z.union([
      z.boolean(),
      z.object({ entries: z.boolean(), imports: z.boolean() }),
    ]),
  });
