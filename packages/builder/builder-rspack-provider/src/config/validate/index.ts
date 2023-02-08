import { fromZodError, z, ZodError } from '@modern-js/builder-shared/zod';
import { BuilderConfig } from '../../types';

import { devConfigSchema } from './dev';
import { htmlConfigSchema } from './html';
import { outputConfigSchema } from './output';
import { performanceConfigSchema } from './performance';
import { sourceConfigSchema } from './source';
import { toolsConfigSchema } from './tools';

export const configSchema: z.ZodType<BuilderConfig> = z.partialObj({
  source: sourceConfigSchema,
  dev: devConfigSchema,
  html: htmlConfigSchema,
  output: outputConfigSchema,
  performance: performanceConfigSchema,
  tools: toolsConfigSchema,
});

export const formatZodError = (error: ZodError<BuilderConfig>) => {
  return fromZodError(error);
};

export const validateBuilderConfig = async (data: unknown) => {
  const parsed = await configSchema.safeParseAsync(data);
  if (!parsed.success) {
    throw formatZodError(parsed.error);
  }
  return parsed.data;
};
