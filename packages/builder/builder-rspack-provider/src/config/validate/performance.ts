import {
  sharedPerformanceConfigSchema,
  z,
  BaseChunkSplit,
  BuilderChunkSplit,
  BaseSplitRulesSchema,
  SplitBySizeSchema,
  SplitCustomSchema,
  ForceSplittingSchema,
} from '@modern-js/builder-shared';
import type { PerformanceConfig } from '../../types';

const BaseChunkSplitSchema: z.ZodType<BaseChunkSplit> =
  BaseSplitRulesSchema.extend({
    strategy: z.enum(['split-by-experience', 'all-in-one', 'single-vendor']),
    forceSplitting: ForceSplittingSchema,
    override: z.any().optional(),
  });

const BuilderChunkSplitSchema: z.ZodType<BuilderChunkSplit> = z.union([
  BaseChunkSplitSchema,
  SplitBySizeSchema,
  SplitCustomSchema,
]);

export const performanceConfigSchema: z.ZodType<PerformanceConfig> =
  sharedPerformanceConfigSchema
    .extend({
      chunkSplit: BuilderChunkSplitSchema,
    })
    .partial();
