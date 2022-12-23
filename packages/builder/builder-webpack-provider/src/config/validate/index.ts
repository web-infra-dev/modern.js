import { z, ZodError } from '@modern-js/builder-shared/zod';
import type { SomeJSONSchema } from '@modern-js/utils/ajv/json-schema';
import { BuilderConfig } from '../../types';

import { devConfigSchema } from './dev';
import { experimentsConfigSchema } from './experiments';
import { htmlConfigSchema } from './html';
import { outputConfigSchema } from './output';
import { performanceConfigSchema } from './performance';
import { securityConfigSchema } from './security';
import { sourceConfigSchema } from './source';
import { toolsConfigSchema } from './tools';

export const configSchema: z.ZodType<BuilderConfig> = z.partialObj({
  source: sourceConfigSchema,
  dev: devConfigSchema,
  html: htmlConfigSchema,
  experiments: experimentsConfigSchema,
  output: outputConfigSchema,
  performance: performanceConfigSchema,
  security: securityConfigSchema,
  tools: toolsConfigSchema,
});

export interface ConfigValidatorOptions {
  cachePath?: string;
  schema?: SomeJSONSchema;
}

export const formatZodError = (error: ZodError<BuilderConfig>) => {
  return new Error('ZodError', error);
};

export const validateBuilderConfig = async (data: unknown) => {
  const parsed = await configSchema.safeParseAsync(data);
  if (!parsed.success) {
    throw formatZodError(parsed.error);
  }
  return parsed.data;
};
