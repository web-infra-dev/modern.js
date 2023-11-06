import { createDebugger } from '@modern-js/utils';
import type { UserConfig, NormalizedConfig, LoadedConfig } from '../types';
import { mergeConfig } from '../utils/mergeConfig';
import { createDefaultConfig } from './createDefaultConfig';

const debug = createDebugger('resolve-config');

export const createResolveConfig = async (
  // eslint-disable-next-line @typescript-eslint/ban-types
  loaded: LoadedConfig<{}>,
  configs: UserConfig[],
): Promise<NormalizedConfig> => {
  const { config: userConfig } = loaded;
  const resolved = mergeConfig([createDefaultConfig(), ...configs, userConfig]);
  debug('resolved %o', resolved);

  return resolved;
};
