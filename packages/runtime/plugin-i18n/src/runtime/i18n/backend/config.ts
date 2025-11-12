import { deepMerge } from '../../../shared/deepMerge';
import type { BackendOptions } from '../instance';

export const DEFAULT_I18NEXT_BACKEND_OPTIONS = {
  loadPath: '/locales/{{lng}}/{{ns}}.json',
  addPath: '/locales/{{lng}}/{{ns}}.json',
};

export function mergeBackendOptions(
  cliOptions: BackendOptions = {},
  userOptions?: BackendOptions,
  defaultOptions: BackendOptions = DEFAULT_I18NEXT_BACKEND_OPTIONS,
): BackendOptions {
  return deepMerge(deepMerge(defaultOptions, cliOptions), userOptions ?? {});
}
