import { initHooks } from './hooks';
import type { AppContext, InternalContext } from './types/context';

interface ContextParams<Config, NormalizedConfig> {
  appContext: AppContext;
  config: Config;
  normalizedConfig: NormalizedConfig;
}

export async function createContext<
  Config = {},
  NormalizedConfig = {},
  Entrypoint = {},
>({
  appContext,
  config,
  normalizedConfig,
}: ContextParams<Config, NormalizedConfig>): Promise<
  InternalContext<Config, NormalizedConfig, Entrypoint>
> {
  return {
    ...appContext,
    hooks: initHooks<Config, NormalizedConfig, Entrypoint>(),
    config,
    normalizedConfig,
  };
}
