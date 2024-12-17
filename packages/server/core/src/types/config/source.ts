import type { Alias } from '@modern-js/utils';
import type { ConfigChain } from './share';

export interface SourceUserConfig {
  alias?: ConfigChain<Alias>;
  enableAsyncEntry?: boolean;
}

export type SourceNormalizedConfig = SourceUserConfig;
