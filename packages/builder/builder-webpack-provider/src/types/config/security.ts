import type { SubresourceIntegrityOptions } from '../thirdParty';

export interface SecurityConfig {
  sri?: SubresourceIntegrityOptions | boolean;
}

export type NormalizedSecurityConfig = SecurityConfig;
