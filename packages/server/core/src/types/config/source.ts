import type { Alias } from '@modern-js/utils';
import type { ChainedConfig } from './share';

export interface SourceUserConfig {
  alias?: ChainedConfig<Alias>;
}

export type SourceNormalizedConfig = SourceUserConfig;
