import { sharedOutputConfigSchema, z } from '@modern-js/builder-shared';
import type { OutputConfig } from '../../types';

export const outputConfigSchema: z.ZodType<OutputConfig> =
  sharedOutputConfigSchema;
