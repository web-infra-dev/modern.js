import { sharedHtmlConfigSchema, z } from '@modern-js/builder-shared';
import type { HtmlConfig } from '../../types';

export const htmlConfigSchema: z.ZodType<HtmlConfig> = sharedHtmlConfigSchema;
