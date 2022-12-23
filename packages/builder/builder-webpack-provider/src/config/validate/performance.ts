import { sharedPerformanceConfigSchema, z } from '@modern-js/builder-shared';
import type {
  BaseChunkSplit,
  BuilderChunkSplit,
  PerformanceConfig,
  SplitBySize,
  SplitCustom,
} from '../../types';

const BaseSplitRulesSchema = z.object({
  strategy: z.string(),
  forceSplitting: z.array(z.instanceof(RegExp)).optional(),
  override: z.any().optional(),
});

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

const SplitBySizeSchema: z.ZodType<SplitBySize> = BaseSplitRulesSchema.extend({
  strategy: z.literal('split-by-size'),
  minSize: z.number().optional(),
  maxSize: z.number().optional(),
});

const SplitCustomSchema: z.ZodType<SplitCustom> = BaseSplitRulesSchema.extend({
  strategy: z.literal('custom'),
  splitChunks: z.any().optional(),
});

const BuilderChunkSplitSchema: z.ZodType<BuilderChunkSplit> = z.union([
  BaseChunkSplitSchema,
  SplitBySizeSchema,
  SplitCustomSchema,
]);

export const performanceConfigSchema: z.ZodType<PerformanceConfig> =
  sharedPerformanceConfigSchema.extend({
    bundleAnalyze: z.any(),
    chunkSplit: BuilderChunkSplitSchema,
  });
