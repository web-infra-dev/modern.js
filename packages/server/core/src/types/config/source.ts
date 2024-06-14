import type { Alias } from '@modern-js/utils';
import type { ConfigChain } from './share';

export interface SourceUserConfig {
  alias?: ConfigChain<Alias>;
}

export type SourceNormalizedConfig = SourceUserConfig;
