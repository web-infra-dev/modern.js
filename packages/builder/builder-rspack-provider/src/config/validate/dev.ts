import { sharedDevConfigSchema, z } from '@modern-js/builder-shared';
import type { DevConfig } from '../../types';

export const devConfigSchema: z.ZodType<DevConfig> = sharedDevConfigSchema;
