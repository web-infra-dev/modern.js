import type { UserConfig } from '../types';

export function createDefaultConfig(): UserConfig {
  return {
    autoLoadPlugins: false,
  };
}
