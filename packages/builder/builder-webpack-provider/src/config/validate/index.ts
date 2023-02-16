import { z } from '@modern-js/builder-shared/zod';
import { BuilderConfig } from '../../types';
import { validateBuilderConfig as validateConfig } from '@modern-js/builder-shared';

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

export const validateBuilderConfig = async (data: unknown) => {
  return validateConfig(configSchema, data);
};
