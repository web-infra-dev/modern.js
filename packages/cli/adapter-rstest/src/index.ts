import {
  type ResolveModernRsbuildConfigOptions,
  resolveModernRsbuildConfig,
} from '@modern-js/app-tools';
import type { ExtendConfigFn } from '@rstest/core';
import { toRstestExtendConfig } from './toRstestConfig';

type AdapterInitOptions = Omit<ResolveModernRsbuildConfigOptions, 'command'>;

export function withModernConfig(
  options: AdapterInitOptions = {},
): ExtendConfigFn {
  return async () => {
    const modern = await resolveModernRsbuildConfig({
      ...options,
      command: 'rstest',
    });

    const rstestExtendConfig = toRstestExtendConfig(modern);
    return rstestExtendConfig;
  };
}
