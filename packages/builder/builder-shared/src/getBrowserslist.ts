import { DEFAULT_BROWSERSLIST } from './constants';
import type {
  BuilderTarget,
  SharedBuilderConfig,
  SharedNormalizedConfig,
} from './types';

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
  config: SharedBuilderConfig | SharedNormalizedConfig,
  target: BuilderTarget,
): Promise<string[]> {
  const { overrideBrowserslist: overrides = {} } = config?.output || {};

  if (target === 'web' || target === 'web-worker') {
    if (Array.isArray(overrides)) {
      return overrides;
    }
    if (overrides[target]) {
      return overrides[target]!;
    }

    const browserslistrc = await getBrowserslist(path);
    if (browserslistrc) {
      return browserslistrc;
    }
  }

  if (!Array.isArray(overrides) && overrides[target]) {
    return overrides[target]!;
  }

  return DEFAULT_BROWSERSLIST[target];
}
