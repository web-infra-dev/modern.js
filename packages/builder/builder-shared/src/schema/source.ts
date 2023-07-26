import { BuilderTarget, MainFields, SharedSourceConfig } from '../types';
import { z } from '../utils';
import { ZodType } from '../zod';

export const BuilderTargetSchema: ZodType<BuilderTarget> = z.enum([
  'web',
  'node',
  'modern-web',
  'web-worker',
]);

export const MainFieldsSchema: ZodType<MainFields> = z.array(
  z.arrayOrNot(z.string()),
);

export const sharedSourceConfigSchema = z.partialObj({
  alias: z.chained(z.record(z.arrayOrNot(z.string()))),
  aliasStrategy: z.enum(['prefer-tsconfig', 'prefer-alias']),
  include: z.array(z.union([z.string(), z.instanceof(RegExp)])),
  exclude: z.array(z.union([z.string(), z.instanceof(RegExp)])),
  preEntry: z.arrayOrNot(z.string()),
  globalVars: z.chained(z.any(), z.any()),
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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _schema: z.ZodType<SharedSourceConfig> = sharedSourceConfigSchema;
