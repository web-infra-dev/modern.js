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

export const ForceSplittingSchema = z
  .union([
    z.array(z.instanceof(RegExp)),
    z.record(z.string(), z.instanceof(RegExp)),
  ])
  .optional();

export const BaseSplitRulesSchema = z.object({
  strategy: z.string(),
  forceSplitting: ForceSplittingSchema,
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

const filterSchema = z.union([
  z.array(z.union([z.string(), z.instanceof(RegExp)])),
  z.function(z.tuple([z.string()]), z.boolean()),
]);

const preloadSchema = z.union([
  z.literal(true),
  z.object({
    type: z
      .enum(['async-chunks', 'initial', 'all-assets', 'all-chunks'])
      .optional(),
    include: filterSchema.optional(),
    exclude: filterSchema.optional(),
  }),
]);

export const sharedPerformanceConfigSchema = z.partialObj({
  removeConsole: z.union([z.boolean(), z.array(ConsoleTypeSchema)]),
  removeMomentLocale: z.boolean(),
  buildCache: z.union([BuildCacheOptionsSchema, z.boolean()]),
  transformLodash: z.boolean(),
  profile: z.boolean(),
  printFileSize: z.boolean(),
  dnsPrefetch: z.array(z.string()),
  preconnect: z.array(
    z.union([
      z.string(),
      z.object({
        href: z.string(),
        crossorigin: z.boolean().optional(),
      }),
    ]),
  ),
  preload: preloadSchema,
  prefetch: preloadSchema,
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _schema: z.ZodType<SharedPerformanceConfig> =
  sharedPerformanceConfigSchema;
