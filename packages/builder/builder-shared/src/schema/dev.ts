import { DevServerHttpsOptions } from '@modern-js/types/server';
import { ProgressBarConfig, SharedDevConfig } from '../types';
import { z } from '../utils';
import { ZodType } from '../zod';

export const DevServerHttpsOptionsSchema: ZodType<DevServerHttpsOptions> =
  z.union([
    z.boolean(),
    z.object({
      key: z.string(),
      cert: z.string(),
    }),
  ]);

export const ProgressBarConfigSchema: ZodType<ProgressBarConfig> = z.partialObj(
  { id: z.string() },
);

export const sharedDevConfigSchema: ZodType<SharedDevConfig> = z.partialObj({
  hmr: z.boolean(),
  port: z.number(),
  https: DevServerHttpsOptionsSchema,
  startUrl: z.union([z.boolean(), z.string(), z.array(z.string())]),
  assetPrefix: z.union([z.string(), z.boolean()]),
  progressBar: z.union([z.boolean(), ProgressBarConfigSchema]),
});
