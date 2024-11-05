import { initHooks } from './hooks';
import type { AppContext, InternalContext } from './types/context';

interface ContextParams<Config, NormalizedConfig> {
  appContext: AppContext<Config, NormalizedConfig>;
  config: Config;
  normalizedConfig: NormalizedConfig;
}

export async function createContext<Config, NormalizedConfig>({
  appContext,
  config,
  normalizedConfig,
}: ContextParams<Config, NormalizedConfig>): Promise<
  InternalContext<Config, NormalizedConfig>
> {
  return {
    ...appContext,
    hooks: initHooks<Config, NormalizedConfig>(),
    config,
    normalizedConfig,
  };
}
