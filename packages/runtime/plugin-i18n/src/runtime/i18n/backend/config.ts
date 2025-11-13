import { deepMerge } from '../../../shared/deepMerge';
import type { BackendOptions } from '../instance';

export function mergeBackendOptions(
  defaultOptions: BackendOptions,
  cliOptions: BackendOptions = {},
  userOptions?: BackendOptions,
): BackendOptions {
  return deepMerge(deepMerge(defaultOptions, cliOptions), userOptions ?? {});
}
