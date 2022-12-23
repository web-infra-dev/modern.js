import {
  BuildCacheOptions,
  ConsoleType,
  SharedPerformanceConfig,
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
