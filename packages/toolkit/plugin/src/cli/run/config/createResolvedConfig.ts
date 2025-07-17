import { createDebugger } from '@modern-js/utils';
import type { DeepPartial } from '../../../types/utils';
import type { LoadedConfig } from '../types';
import { mergeConfig } from '../utils/mergeConfig';

const debug = createDebugger('resolve-config');

export const createResolveConfig = async <Config, NormalizedConfig>(
  loaded: LoadedConfig<Config>,
  configs: DeepPartial<Config>[],
): Promise<NormalizedConfig> => {
  const { config: userConfig } = loaded;
  const resolved = mergeConfig<Config, NormalizedConfig>([
    {} as Config,
    ...configs,
    userConfig,
  ]);
  debug('resolved %o', resolved);

  return resolved;
};
