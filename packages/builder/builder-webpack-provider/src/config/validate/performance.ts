import {
  sharedPerformanceConfigSchema,
  z,
  BaseChunkSplit,
  BuilderChunkSplit,
  BaseSplitRulesSchema,
  SplitBySizeSchema,
  SplitCustomSchema,
} from '@modern-js/builder-shared';
import type { PerformanceConfig } from '../../types';

const BaseChunkSplitSchema: z.ZodType<BaseChunkSplit> =
  BaseSplitRulesSchema.extend({
    strategy: z.literals([
      'split-by-module',
      'split-by-experience',
      'all-in-one',
      'single-vendor',
    ]),
    forceSplitting: z.array(z.instanceof(RegExp)).optional(),
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
      bundleAnalyze: z.any(),
      chunkSplit: BuilderChunkSplitSchema,
    })
    .partial();
