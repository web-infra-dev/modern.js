import { DEFAULT_BROWSERSLIST } from './constants';
import type { BuilderTarget, SharedNormalizedConfig } from './types';

// using cache to avoid multiple calls to loadConfig
const browsersListCache = new Map<string, string[]>();

export async function getBrowserslist(path: string) {
  if (browsersListCache.has(path)) {
    return browsersListCache.get(path)!;
  }

  const { default: browserslist } = await import(
    '@modern-js/utils/browserslist'
  );
  const result = browserslist.loadConfig({ path });

  if (result) {
    browsersListCache.set(path, result);
    return result;
  }

  return null;
}

export async function getBrowserslistWithDefault(
  path: string,
  config: SharedNormalizedConfig,
  target: BuilderTarget,
) {
  if (config?.output?.overrideBrowserslist) {
    const { overrideBrowserslist } = config.output;
    if (Array.isArray(overrideBrowserslist)) {
      return overrideBrowserslist;
    }
    return overrideBrowserslist[target] || DEFAULT_BROWSERSLIST[target];
  }

  const result = await getBrowserslist(path);
  return result || DEFAULT_BROWSERSLIST[target];
}
