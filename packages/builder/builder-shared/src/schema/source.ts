import { BuilderTarget, MainFields, SharedSourceConfig } from '../types';
import { z } from '../utils';
import { ZodType } from '../zod';

export const BuilderTargetSchema: ZodType<BuilderTarget> = z.literals([
  'web',
  'node',
  'modern-web',
  'web-worker',
]);

export const MainFieldsSchema: ZodType<MainFields> = z.array(
  z.arrayOrNot(z.string()),
);

export const sharedSourceConfigSchema: ZodType<SharedSourceConfig> =
  z.partialObj({
    alias: z.chained(z.record(z.arrayOrNot(z.string()))),
    define: z.record(z.any()),
    include: z.array(z.union([z.string(), z.instanceof(RegExp)])),
    exclude: z.array(z.union([z.string(), z.instanceof(RegExp)])),
    preEntry: z.arrayOrNot(z.string()),
    globalVars: z.record(z.json()),
    compileJsDataURI: z.boolean(),
    resolveMainFields: z.union([
      MainFieldsSchema,
      z.record(BuilderTargetSchema, MainFieldsSchema),
    ]),
    resolveExtensionPrefix: z.union([
      z.string(),
      z.record(BuilderTargetSchema, z.string()),
    ]),
  });
