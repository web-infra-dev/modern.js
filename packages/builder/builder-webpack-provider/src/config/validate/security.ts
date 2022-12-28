import { sharedSecurityConfigSchema, z } from '@modern-js/builder-shared';
import type { SecurityConfig } from '../../types';

export const securityConfigSchema: z.ZodType<SecurityConfig> =
  sharedSecurityConfigSchema;
