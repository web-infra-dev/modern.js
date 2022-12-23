import { z } from '@modern-js/builder-shared';
import type { ToolsConfig } from '../../types';

export const toolsConfigSchema: z.ZodType<ToolsConfig> = z.partialObj({
  pug: z.union([z.literal(true), z.chained(z.any(), z.any())]),
});
