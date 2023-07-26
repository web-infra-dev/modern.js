import { z } from '@modern-js/builder-shared/zod';
import {
  validateBuilderConfig as validateConfig,
  logger,
} from '@modern-js/builder-shared';
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
  if (typeof data === 'object') {
    const config = data as BuilderConfig;
    if (!config.output?.disableCssExtract) {
      if (config.output?.enableCssModuleTSDeclaration) {
        logger.warn(
          'enableCssModuleTSDeclaration only takes effect when output.disableCssExtract is set to true',
        );
      }
      if (config.tools?.styleLoader) {
        logger.warn(
          'tools.styleLoader only takes effect when output.disableCssExtract is set to true',
        );
      }
    }
  }

  return validateConfig(configSchema, data);
};
