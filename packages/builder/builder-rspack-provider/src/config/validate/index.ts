import { z } from '@modern-js/builder-shared/zod';
import { validateBuilderConfig as validateConfig } from '@modern-js/builder-shared';
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

export const validateBuilderConfig = async (data: unknown) => {
  return validateConfig(configSchema, data);
};
