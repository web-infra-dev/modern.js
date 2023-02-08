import {
  BuildCacheOptions,
  ConsoleType,
  SharedPerformanceConfig,
  SplitBySize,
  SplitCustom,
} from '../types';
import { z } from '../utils';
import { ZodType } from '../zod';

export const ConsoleTypeSchema: ZodType<ConsoleType> = z.literals([
  'log',
  'info',
  'warn',
  'error',
  'table',
  'group',
]);

export const BuildCacheOptionsSchema: ZodType<BuildCacheOptions> = z.partialObj(
  { cacheDirectory: z.string() },
);

export const BaseSplitRulesSchema = z.object({
  strategy: z.string(),
  forceSplitting: z.array(z.instanceof(RegExp)).optional(),
  override: z.any().optional(),
});

export const SplitBySizeSchema: z.ZodType<SplitBySize> =
  BaseSplitRulesSchema.extend({
    strategy: z.literal('split-by-size'),
    minSize: z.number().optional(),
    maxSize: z.number().optional(),
  });

export const SplitCustomSchema: z.ZodType<SplitCustom> =
  BaseSplitRulesSchema.extend({
    strategy: z.literal('custom'),
    splitChunks: z.any().optional(),
  });

export const sharedPerformanceConfigSchema = z.partialObj({
  removeConsole: z.union([z.boolean(), z.array(ConsoleTypeSchema)]),
  removeMomentLocale: z.boolean(),
  buildCache: z.union([BuildCacheOptionsSchema, z.boolean()]),
  profile: z.boolean(),
  printFileSize: z.boolean(),
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _schema: z.ZodType<SharedPerformanceConfig> =
  sharedPerformanceConfigSchema;
