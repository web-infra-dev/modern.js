import { sharedOutputConfigSchema, z } from '@modern-js/builder-shared';
import type { CopyPluginOptions, OutputConfig } from '../../types';

const AdditionalOptionsSchema = z.partialObj({ concurrency: z.number() });

const CopyPluginPatternsSchema = z.array(z.any());

const CopyPluginOptionsSchema: z.ZodType<CopyPluginOptions> = z.object({
  patterns: CopyPluginPatternsSchema,
  options: z.optional(AdditionalOptionsSchema),
});

export const outputConfigSchema: z.ZodType<OutputConfig> =
  sharedOutputConfigSchema.extend({
    copy: z.union([CopyPluginOptionsSchema, CopyPluginPatternsSchema]),
    convertToRem: z.union([z.boolean(), z.instanceof(Object)]),
    externals: z.any(),
  });
