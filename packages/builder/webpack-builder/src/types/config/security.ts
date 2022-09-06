import type { SubresourceIntegrityOptions } from '../thirdParty';

export interface SecurityConfig {
  sri?: SubresourceIntegrityOptions | boolean;
}
